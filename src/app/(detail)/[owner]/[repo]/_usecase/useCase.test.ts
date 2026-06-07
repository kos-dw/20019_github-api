import { assert, describe, expect, it, vi } from "vitest";
import { InvalidRepoFullNameError, Owner, RepoStore, Repo, RepoFullName, RepoStats } from "@/app/_shared/github/domain";
import { RepoNotFoundError } from "@/app/_shared/github/errors";
import { err, ok } from "@/utils/result";
import { GetRepo } from "./useCase";

const makeSampleRepo = (): Repo => {
  const fullNameResult = RepoFullName.create("octocat", "Hello-World");
  assert(fullNameResult.ok, "RepoFullName の生成に失敗しました（テストセットアップ）");

  return new Repo({
    id: 1296269,
    fullName: fullNameResult.val,
    owner: new Owner("octocat", "https://github.com/images/error/octocat_happy.gif"),
    stats: new RepoStats({ stars: 80, watchers: 42, forks: 9, issues: 0 }),
    language: null,
  });
};

const createUseCase = () => {
  const repo: RepoStore = {
    search: vi.fn(),
    findByFullName: vi.fn(),
  };
  const useCase = new GetRepo(repo);
  return { useCase, repo };
};

describe("GetRepo", () => {
  it("正常な owner/repo で repo.findByFullName を呼び出し結果を返すこと", async () => {
    // Arrange
    const { useCase, repo } = createUseCase();
    const sampleRepo = makeSampleRepo();
    vi.mocked(repo.findByFullName).mockResolvedValue(ok(sampleRepo));

    // Act
    const result = await useCase.execute({ owner: "octocat", repo: "Hello-World" });

    // Assert
    assert(result.ok, "成功結果（ok: true）を期待しています");
    expect(result.val).toBe(sampleRepo);
    expect(repo.findByFullName).toHaveBeenCalledOnce();
  });

  it("空の owner のとき InvalidRepoFullNameError を返し repo.findByFullName を呼び出さないこと", async () => {
    // Arrange
    const { useCase, repo } = createUseCase();

    // Act
    const result = await useCase.execute({ owner: "", repo: "Hello-World" });

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBeInstanceOf(InvalidRepoFullNameError);
    expect(repo.findByFullName).not.toHaveBeenCalled();
  });

  it("空の repo のとき InvalidRepoFullNameError を返し repo.findByFullName を呼び出さないこと", async () => {
    // Arrange
    const { useCase, repo } = createUseCase();

    // Act
    const result = await useCase.execute({ owner: "octocat", repo: "" });

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBeInstanceOf(InvalidRepoFullNameError);
    expect(repo.findByFullName).not.toHaveBeenCalled();
  });

  it("repo.findByFullName が RepoNotFoundError を返したときそのまま伝播すること", async () => {
    // Arrange
    const { useCase, repo } = createUseCase();
    const notFoundError = new RepoNotFoundError();
    vi.mocked(repo.findByFullName).mockResolvedValue(err(notFoundError));

    // Act
    const result = await useCase.execute({ owner: "octocat", repo: "Hello-World" });

    // Assert
    assert(!result.ok, "エラー結果（ok: false）を期待しています");
    expect(result.err).toBe(notFoundError);
  });
});
