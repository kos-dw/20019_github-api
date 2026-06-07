import { assert, describe, expect, it } from "vitest";
import {
  DomainError,
  EmptySearchQueryError,
  InvalidPageError,
  InvalidRepoFullNameError,
  Owner,
  Repo,
  RepoFullName,
  RepoStats,
} from "./domain";

describe("DomainError（基底クラス）", () => {
  class DummyDomainError extends DomainError {
    readonly code = "DUMMY_CODE" as const;
    constructor(message = "this is dummy class") {
      super(message);
    }
  }

  it("Error型およびDomainError型を正しく継承していること", () => {
    // Act
    const error = new DummyDomainError();

    // Assert
    expect(error).toBeInstanceOf(Error);
    expect(error).toBeInstanceOf(DomainError);
  });

  it("設定したエラーコード（code）が正しく取得できること", () => {
    // Arrange
    const expectedCode = "DUMMY_CODE";

    // Act
    const error = new DummyDomainError();

    // Assert
    expect(error.code).toBe(expectedCode);
  });
});

describe("EmptySearchQueryError", () => {
  it("DomainErrorを正しく継承していること", () => {
    // Act
    const error = new EmptySearchQueryError();

    // Assert
    expect(error).toBeInstanceOf(DomainError);
  });

  it('エラーコードが "EMPTY_SEARCH_QUERY" であること', () => {
    // Arrange
    const expectedCode = "EMPTY_SEARCH_QUERY";

    // Act
    const error = new EmptySearchQueryError();

    // Assert
    expect(error.code).toBe(expectedCode);
  });
});

describe("InvalidPageError", () => {
  it("DomainErrorを正しく継承していること", () => {
    // Act
    const error = new InvalidPageError();

    // Assert
    expect(error).toBeInstanceOf(DomainError);
  });

  it('エラーコードが "INVALID_PAGE" であること', () => {
    // Arrange
    const expectedCode = "INVALID_PAGE";

    // Act
    const error = new InvalidPageError();

    // Assert
    expect(error.code).toBe(expectedCode);
  });
});

describe("Owner", () => {
  it("有効な引数からlogin名とavatarUrlを正しく生成できること", () => {
    // Arrange
    const expectedLogin = "octocat";
    const expectedAvatarUrl = "https://github.com/images/error/octocat_happy.gif";

    // Act
    const owner = new Owner(expectedLogin, expectedAvatarUrl);

    // Assert
    expect(owner.login).toBe(expectedLogin);
    expect(owner.avatarUrl).toBe(expectedAvatarUrl);
  });

  it("login名が空文字の場合、エラーをスローすること", () => {
    // Arrange
    const invalidLogin = "";
    const dummyAvatarUrl = "";

    // Act(エラーのスロー検証はActとAssertを即時関数で同時に評価)
    expect(() => new Owner(invalidLogin, dummyAvatarUrl)).toThrow(/login/);
  });
});

describe("RepoFullName", () => {
  it("有効な所有者名とリポジトリ名から、正常にフルネーム（owner/repo）を生成できること", () => {
    // Arrange
    const owner = "octocat";
    const repo = "git-repo";
    const expectedValue = "octocat/git-repo";

    // Act
    const result = RepoFullName.create(owner, repo);

    // Assert
    assert(result.ok, "成功結果（ok: true）を期待しています");
    expect(result.val.value).toBe(expectedValue);
    expect(result.val.owner).toBe(owner);
    expect(result.val.repo).toBe(repo);
  });

  it.each([
    { owner: "", repo: "git-repo", desc: "owner が空文字" },
    { owner: "octocat", repo: "", desc: "repo が空文字" },
    { owner: "   ", repo: "git-repo", desc: "owner がスペースのみ" },
    { owner: "octocat", repo: "   ", desc: "repo がスペースのみ" },
  ])("$desc のとき生成に失敗し InvalidRepoFullNameError が返されること", ({ owner, repo }) => {
    // Act
    const result = RepoFullName.create(owner, repo);

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBeInstanceOf(InvalidRepoFullNameError);
  });
});

describe("RepoStats", () => {
  it("初期化時に渡した各統計数値（Stars / Watchers / Forks / Issues）をそのまま保持すること", () => {
    // Arrange
    const mockStats = {
      stars: 12345,
      watchers: 98,
      forks: 678,
      issues: 12,
    };

    // Act
    const result = new RepoStats(mockStats);

    // Assert
    expect(result.stars).toBe(mockStats.stars);
    expect(result.watchers).toBe(mockStats.watchers);
    expect(result.forks).toBe(mockStats.forks);
    expect(result.issues).toBe(mockStats.issues);
  });
});

describe("Repo", () => {
  const fullNameResult = RepoFullName.create("owner", "git-repo");
  assert(fullNameResult.ok, "RepoFullName の生成に失敗しました（テストセットアップ）");
  const sharedFullName = fullNameResult.val;
  const sharedStats = new RepoStats({ stars: 1, watchers: 1, forks: 1, issues: 1 });
  const sharedOwner = new Owner("owner", "https://example.com/avatar.gif");

  const makeRepo = (id: number) =>
    new Repo({ id, fullName: sharedFullName, owner: sharedOwner, stats: sharedStats, language: null });

  it("IDが一致する場合、equals が true を返すこと（同一性判定）", () => {
    // Arrange
    const targetId = 123456;
    const repoA = makeRepo(targetId);
    const repoB = makeRepo(targetId);

    // Act
    const isIdentical = repoA.equals(repoB);

    // Assert
    expect(isIdentical).toBe(true);
  });

  it("IDが異なる場合、equals が false を返すこと（同一性判定）", () => {
    // Arrange
    const repoA = makeRepo(123456);
    const repoB = makeRepo(123789);

    // Act
    const isIdentical = repoA.equals(repoB);

    // Assert
    expect(isIdentical).toBe(false);
  });
});
