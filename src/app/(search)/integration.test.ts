/**
 * 結合テスト: SearchRepos UseCase → GitHubRepoStore → GitHubHttpClient
 *
 * 各単体テストが「層ごとの正しさ」を保証するのに対し、
 * この結合テストは「層をまたいだ協調動作の正しさ」を保証する。
 * 具体的には:
 *   - UseCase のバリデーションが通ったリクエストだけ Infra に届くこと
 *   - Infra が受け取った HTTP レスポンスを正しくドメインエラーに変換し UseCase を経由して呼び出し元に届くこと
 *
 * スタブ境界: fetch のみ（= HTTP の外側だけを差し替え、それより内側は本物を使う）
 */

import { EmptySearchQueryError } from "@/app/_shared/github/domain";
import { ExternalServiceError, RateLimitExceededError } from "@/app/_shared/github/errors";
import { GitHubRepoStore } from "@/app/_shared/github/infra";
import { GITHUB_API_BASE_URL } from "@/config/github";
import { GitHubHttpClient } from "@/libs/github/HttpClient";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { SearchRepos } from "./_usecase/useCase";

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
  return new SearchRepos(store);
};

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

// ─── テスト ─────────────────────────────────────────────────────

describe("SearchRepos 結合テスト（UseCase → Infra → HTTP）", () => {
  describe("正常系", () => {
    it("正常なクエリとページ番号のとき、APIレスポンスがRepoインスタンスに変換されて返ること", async () => {
      // Arrange
      const searchResponse = {
        total_count: 1,
        incomplete_results: false,
        items: [repoDto],
      };
      stubFetch(200, { body: searchResponse });
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ query: "react", page: 1 });

      // Assert
      assert(result.ok, "成功結果（ok: true）を期待しています");
      expect(result.val.totalCount).toBe(1);
      expect(result.val.items).toHaveLength(1);
      expect(result.val.items[0].fullName.value).toBe("octocat/Hello-World");
      expect(result.val.items[0].stats.stars).toBe(80);
    });
  });

  describe("バリデーションエラー系（UseCase 層で弾かれ fetch は呼ばれない）", () => {
    it("空文字クエリのとき、fetchを呼ばずにEmptySearchQueryErrorが返ること", async () => {
      // Arrange
      stubFetch(200);
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ query: "   ", page: 1 });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(EmptySearchQueryError);
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });

    it("ページ番号が0のとき、fetchを呼ばずにInvalidPageErrorが返ること", async () => {
      // Arrange
      stubFetch(200);
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ query: "react", page: 0 });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      // InvalidPageError は domain 層で定義されているため、エラーコードで検証
      expect(result.err.code).toBe("INVALID_PAGE");
      expect(vi.mocked(fetch)).not.toHaveBeenCalled();
    });
  });

  describe("外部サービスエラー系（Infra 層でドメインエラーに変換される）", () => {
    it("APIが403かつレートリミットヘッダ付きのとき、RateLimitExceededErrorが返ること", async () => {
      // Arrange
      stubFetch(403, { headers: { "x-ratelimit-remaining": "0" } });
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ query: "react", page: 1 });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(RateLimitExceededError);
    });

    it("APIが500を返したとき、ExternalServiceErrorが返ること", async () => {
      // Arrange
      stubFetch(500);
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ query: "react", page: 1 });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(ExternalServiceError);
    });

    it("fetchがrejectしたとき（ネットワーク障害）、ExternalServiceErrorが返ること", async () => {
      // Arrange
      stubFetchReject();
      const useCase = createUseCase();

      // Act
      const result = await useCase.execute({ query: "react", page: 1 });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(ExternalServiceError);
    });
  });

  describe("HTTPリクエストの検証", () => {
    it("クエリとページ番号が正しいURLパラメータとして組み立てられていること", async () => {
      // Arrange
      stubFetch(200, { body: { total_count: 0, incomplete_results: false, items: [] } });
      const mockedFetch = vi.mocked(fetch);
      const useCase = createUseCase();

      // Act
      await useCase.execute({ query: "typescript", page: 3 });

      // Assert
      const [calledUrl] = mockedFetch.mock.calls[0];
      expect(calledUrl.toString()).toContain("q=typescript");
      expect(calledUrl.toString()).toContain("page=3");
    });
  });
});
