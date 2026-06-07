import { assert, describe, expect, it, vi } from "vitest";
import {
  EmptySearchQueryError,
  InvalidPageError,
  Owner,
  RepoStore,
  Repo,
  RepoFullName,
  RepoStats,
} from "@/app/_shared/github/domain";
import { DEFAULT_PER_PAGE, SEARCH_RESULT_HARD_LIMIT } from "@/config/github";
import { ExternalServiceError } from "@/app/_shared/github/errors";
import { err, ok } from "@/utils/result";
import { Page, SearchQuery } from "./searchVo";
import { SearchRepos } from "./useCase";

const MAX_PAGE = Math.floor(SEARCH_RESULT_HARD_LIMIT / DEFAULT_PER_PAGE);

describe("SearchQuery", () => {
  it("通常の文字列をそのまま保持すること", () => {
    // Arrange
    const raw = "react";

    // Act
    const result = SearchQuery.create(raw);

    // Assert
    assert(result.ok, "成功結果（ok: true）を期待しています");
    expect(result.val.value).toBe("react");
  });

  it("前後の空白を trim して保持すること", () => {
    // Arrange
    const raw = "  react  ";

    // Act
    const result = SearchQuery.create(raw);

    // Assert
    assert(result.ok, "成功結果（ok: true）を期待しています");
    expect(result.val.value).toBe("react");
  });

  it.each([
    { raw: "", desc: "空文字" },
    { raw: "   ", desc: "空白のみ" },
  ])("$desc のとき生成に失敗し EmptySearchQueryError が返されること", ({ raw }) => {
    // Act
    const result = SearchQuery.create(raw);

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBeInstanceOf(EmptySearchQueryError);
  });
});

describe("Page", () => {
  it("1 のとき正常に生成できること", () => {
    // Act
    const result = Page.create(1);

    // Assert
    assert(result.ok, "成功結果（ok: true）を期待しています");
    expect(result.val.value).toBe(1);
  });

  it.each([
    { value: 0, desc: "0" },
    { value: -1, desc: "負数" },
    { value: 1.5, desc: "非整数" },
    { value: MAX_PAGE + 1, desc: "上限超過" },
  ])("$desc のとき生成に失敗し InvalidPageError が返されること", ({ value }) => {
    // Act
    const result = Page.create(value);

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBeInstanceOf(InvalidPageError);
  });

  it(`上限値 ${MAX_PAGE} のとき正常に生成できること`, () => {
    // Act
    const result = Page.create(MAX_PAGE);

    // Assert
    assert(result.ok, "成功結果（ok: true）を期待しています");
    expect(result.val.value).toBe(MAX_PAGE);
  });
});

describe("SearchRepos", () => {
  const makeSampleRepo = (): Repo => {
    const fullNameResult = RepoFullName.create("octocat", "Hello-World");
    assert(fullNameResult.ok, "RepoFullName の生成に失敗しました（テストセットアップ）");

    return new Repo({
      id: 1,
      fullName: fullNameResult.val,
      owner: new Owner("octocat", "https://example.com/avatar.gif"),
      stats: new RepoStats({ stars: 1, watchers: 1, forks: 1, issues: 1 }),
      language: "TypeScript",
    });
  };

  const createUseCase = () => {
    const repo: RepoStore = {
      search: vi.fn(),
      findByFullName: vi.fn(),
    };
    const useCase = new SearchRepos(repo);
    return { useCase, repo };
  };

  it("正常な query/page で repo.search を呼び出し結果を返すこと", async () => {
    // Arrange
    const { useCase, repo } = createUseCase();
    const sampleRepo = makeSampleRepo();
    const searchResult = { items: [sampleRepo], totalCount: 1 };
    vi.mocked(repo.search).mockResolvedValue(ok(searchResult));

    // Act
    const result = await useCase.execute({ query: "react", page: 1 });

    // Assert
    assert(result.ok, "成功結果（ok: true）を期待しています");
    expect(result.val).toEqual(searchResult);
    expect(repo.search).toHaveBeenCalledWith({ query: "react", page: 1 });
  });

  it("空 query のとき EmptySearchQueryError を返し repo.search を呼び出さないこと", async () => {
    // Arrange
    const { useCase, repo } = createUseCase();

    // Act
    const result = await useCase.execute({ query: "   ", page: 1 });

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBeInstanceOf(EmptySearchQueryError);
    expect(repo.search).not.toHaveBeenCalled();
  });

  it("不正 page のとき InvalidPageError を返し repo.search を呼び出さないこと", async () => {
    // Arrange
    const { useCase, repo } = createUseCase();

    // Act
    const result = await useCase.execute({ query: "react", page: 0 });

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBeInstanceOf(InvalidPageError);
    expect(repo.search).not.toHaveBeenCalled();
  });

  it("repo.search が err を返したときそのまま伝播すること", async () => {
    // Arrange
    const { useCase, repo } = createUseCase();
    const serviceError = new ExternalServiceError();
    vi.mocked(repo.search).mockResolvedValue(err(serviceError));

    // Act
    const result = await useCase.execute({ query: "react", page: 1 });

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBe(serviceError);
  });
});
