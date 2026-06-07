/**
 * 結合テスト: GetRepo UseCase → GitHubRepoStore → GitHubHttpClient
 *
 * 検索フローと同様に、詳細取得フロー全体の協調動作を保証する。
 * 「owner/repo の文字列バリデーション（UseCase）」から「API レスポンスの Repo 変換（Infra）」まで
 * を通貫させ、単体テストでは検出できない層間の契約違反を捉える。
 *
 * スタブ境界: fetch のみ
 */

import { InvalidRepoFullNameError, Repo } from "@/app/_shared/github/domain";
import { ExternalServiceError, RepoNotFoundError } from "@/app/_shared/github/errors";
import { GitHubRepoStore } from "@/app/_shared/github/infra";
import { GITHUB_API_BASE_URL } from "@/config/github";
import { GitHubHttpClient } from "@/libs/github/HttpClient";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { GetRepo } from "./_usecase/useCase";

// ─── テストヘルパー ──────────────────────────────────────────────

const repoDto = {
  id: 1296269,
  name: "Hello-World",
  full_name: "octocat/Hello-World",
  owner: {
    login: "octocat",
    avatar_url: "https://github.com/images/error/octocat_happy.gif",
  },
  stargazers_count: 80,
  subscribers_count: 42,
  forks_count: 9,
  open_issues_count: 0,
  language: "TypeScript",
};

const stubFetch = (status: number, options: { body?: unknown; headers?: HeadersInit } = {}) =>
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      status,
      ok: status >= 200 && status < 300,
      headers: new Headers(options.headers),
      json: () => Promise.resolve(options.body),
    })
  );

const stubFetchReject = () => vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("network failure")));

const createUseCase = () => {
  const http = new GitHubHttpClient(GITHUB_API_BASE_URL);
  const store = new GitHubRepoStore(http);
  return new GetRepo(store);
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── テスト ─────────────────────────────────────────────────────

describe("GetRepo 結合テスト（UseCase → Infra → HTTP）", () => {
  describe("正常系", () => {
    it("有効なowner/repoのとき、APIレスポンスがRepoインスタンスに変換されて返ること", async () => {
      // Arrange
      stubFetch(200, { body: repoDto });
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ owner: "octocat", repo: "Hello-World" });

      // Assert
      assert(result.ok, "成功結果（ok: true）を期待しています");
      expect(result.val).toBeInstanceOf(Repo);
      expect(result.val.fullName.value).toBe("octocat/Hello-World");
      expect(result.val.owner.login).toBe("octocat");
      expect(result.val.stats.stars).toBe(80);
      expect(result.val.stats.watchers).toBe(42);
      expect(result.val.stats.forks).toBe(9);
      expect(result.val.stats.issues).toBe(0);
      expect(result.val.language).toBe("TypeScript");
    });

    it("language が null のリポジトリも正しくマッピングされること", async () => {
      // Arrange
      stubFetch(200, { body: { ...repoDto, language: null } });
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ owner: "octocat", repo: "Hello-World" });

      // Assert
      assert(result.ok, "成功結果（ok: true）を期待しています");
      expect(result.val.language).toBeNull();
    });
  });

  describe("バリデーションエラー系（UseCase 層で弾かれ fetch は呼ばれない）", () => {
    it("ownerが空文字のとき、fetchを呼ばずにInvalidRepoFullNameErrorが返ること", async () => {
      // Arrange
      stubFetch(200);
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ owner: "   ", repo: "Hello-World" });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(InvalidRepoFullNameError);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it("repoが空文字のとき、fetchを呼ばずにInvalidRepoFullNameErrorが返ること", async () => {
      // Arrange
      stubFetch(200);
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ owner: "octocat", repo: "" });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(InvalidRepoFullNameError);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });
  });

  describe("外部サービスエラー系（Infra 層でドメインエラーに変換される）", () => {
    it("APIが404を返したとき、RepoNotFoundErrorが返ること", async () => {
      // Arrange
      stubFetch(404);
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ owner: "octocat", repo: "not-exist" });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(RepoNotFoundError);
    });

    it("APIが403かつレートリミットヘッダ付きのとき、RateLimitExceededErrorが返ること", async () => {
      // Arrange
      stubFetch(403, { headers: { "x-ratelimit-remaining": "0" } });
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ owner: "octocat", repo: "Hello-World" });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err.code).toBe("RATE_LIMIT_EXCEEDED");
    });

    it("fetchがrejectしたとき（ネットワーク障害）、ExternalServiceErrorが返ること", async () => {
      // Arrange
      stubFetchReject();
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ owner: "octocat", repo: "Hello-World" });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(ExternalServiceError);
    });
  });

  describe("HTTPリクエストの検証", () => {
    it("ownerとrepoが正しいエンドポイントパスで組み立てられていること", async () => {
      // Arrange
      stubFetch(200, { body: repoDto });
      const mockedFetch = vi.mocked(fetch);
      const useCase = createUseCase();

      // Act
      await useCase.execute({ owner: "octocat", repo: "Hello-World" });

      // Assert
      const [calledUrl] = mockedFetch.mock.calls[0];
      expect(calledUrl.toString()).toContain("/repos/octocat/Hello-World");
    });
  });
});
