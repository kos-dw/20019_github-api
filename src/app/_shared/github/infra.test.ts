import { GITHUB_API_BASE_URL } from "@/config/github";
import { GitHubHttpClient } from "@/libs/github/HttpClient";
import { afterEach, assert, describe, expect, it, vi } from "vitest";
import { Repo, RepoFullName } from "./domain";
import { ExternalServiceError, RateLimitExceededError, RepoNotFoundError } from "./errors";
import { GitHubRepoStore, toRepo } from "./infra";

describe("toRepo", () => {
  const params = {
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
  };

  const makeDto = (language: string | null) => ({ ...params, language });

  it("GitHubRepoDto を Repo に正しく変換できていること", () => {
    // Arrange
    const dto = makeDto("typescript");

    // Act
    const actualRepo = toRepo(dto);

    // Assert
    expect(actualRepo.id).toBe(dto.id);
    expect(actualRepo.fullName.value).toBe(dto.full_name);
    expect(actualRepo.owner.login).toBe(dto.owner.login);
    expect(actualRepo.owner.avatarUrl).toBe(dto.owner.avatar_url);
    expect(actualRepo.stats.stars).toBe(dto.stargazers_count);
    expect(actualRepo.stats.watchers).toBe(dto.subscribers_count);
    expect(actualRepo.stats.forks).toBe(dto.forks_count);
    expect(actualRepo.stats.issues).toBe(dto.open_issues_count);
    expect(actualRepo.language).toBe(dto.language);
  });

  it("language が null の場合でも正しく変換できること", () => {
    // Arrange
    const dto = makeDto(null);

    // Act
    const actualRepo = toRepo(dto);

    // Assert
    expect(actualRepo.language).toBeNull();
  });
});

describe("GitHubRepoStore", () => {
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

  const createStore = (tokenProvider?: () => string | undefined) => {
    const http = new GitHubHttpClient(GITHUB_API_BASE_URL, tokenProvider);
    return new GitHubRepoStore(http);
  };

  // body は 2xx 時のみ HttpClient が json() で読む。エラー時は if (!res.ok) で早期 return するため不要
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

  afterEach(() => {
    vi.restoreAllMocks();
    vi.unstubAllGlobals();
  });

  describe("search", () => {
    it("APIが200を返したとき、okでRepoインスタンスとtotalCountを返すこと", async () => {
      // Arrange
      const expectedTotalCount = 40;
      const searchResponse = {
        total_count: expectedTotalCount,
        incomplete_results: false,
        items: [repoDto],
      };
      stubFetch(200, { body: searchResponse });
      const store = createStore();

      // Act
      const result = await store.search({ query: "hello", page: 1 });

      // Assert
      assert(result.ok, "成功結果（ok: true）を期待しています");
      expect(result.val.totalCount).toBe(expectedTotalCount);
      expect(result.val.items).toHaveLength(1);
      expect(result.val.items[0]).toBeInstanceOf(Repo);
    });

    it("APIが403かつレートリミットヘッダ付きで返したとき、errでRateLimitExceededErrorを返すこと", async () => {
      // Arrange
      stubFetch(403, { headers: { "x-ratelimit-remaining": "0" } });
      const store = createStore();

      // Act
      const result = await store.search({ query: "hello", page: 1 });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(RateLimitExceededError);
    });

    it("APIが500を返したとき、errでExternalServiceErrorを返すこと", async () => {
      // Arrange
      stubFetch(500);
      const store = createStore();

      // Act
      const result = await store.search({ query: "hello", page: 1 });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(ExternalServiceError);
    });

    it("fetchがrejectしたとき、errでExternalServiceErrorを返すこと", async () => {
      // Arrange
      stubFetchReject();
      const store = createStore();

      // Act
      const result = await store.search({ query: "hello", page: 1 });

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(ExternalServiceError);
    });
  });

  describe("findByFullName", () => {
    it("APIが404を返したとき、errでRepoNotFoundErrorを返すこと", async () => {
      // Arrange
      stubFetch(404);
      const store = createStore();
      const fullNameResult = RepoFullName.create("octocat", "Hello-World");
      assert(fullNameResult.ok, "RepoFullName の生成に成功していること");
      const fullName = fullNameResult.val;

      // Act
      const result = await store.findByFullName(fullName);

      // Assert
      assert(!result.ok, "エラー結果（ok: false）を期待しています");
      expect(result.err).toBeInstanceOf(RepoNotFoundError);
    });
  });

  describe("認証", () => {
    it("GITHUB_TOKENが設定されているとき、Authorizationヘッダが付与されること", async () => {
      // Arrange
      const expectedToken = "ghp_test_token";
      stubFetch(200, { body: { total_count: 0, incomplete_results: false, items: [] } });
      const mockedFetch = vi.mocked(fetch);
      const store = createStore(() => expectedToken);

      // Act
      await store.search({ query: "hello", page: 1 });

      // Assert
      const [, calledOptions] = mockedFetch.mock.calls[0];
      const calledHeaders = calledOptions?.headers;
      if (!(calledHeaders instanceof Headers)) throw new Error("expected Headers");
      expect(calledHeaders.get("Authorization")).toBe(`Bearer ${expectedToken}`);
    });
  });
});
