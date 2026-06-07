import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExternalServiceError, RepoNotFoundError } from "@/app/_shared/github/errors";
import { err, ok } from "@/utils/result";

// vi.hoisted: vi.mock ファクトリより先に評価されるため、モック内で参照できる
const mocks = vi.hoisted(() => ({ execute: vi.fn() }));

// GetRepo クラスを class キーワードでモック（Vitest の class support に準拠）
vi.mock("./_usecase/useCase", () => ({
  GetRepo: class {
    execute = mocks.execute;
  },
}));

// page.tsx 内で DI 構築に使われる依存を差し替える
vi.mock("@/app/_shared/github/infra", () => ({ GitHubRepoStore: vi.fn() }));
vi.mock("@/libs/github/HttpClient", () => ({ GitHubHttpClient: vi.fn() }));
vi.mock("@/config/github", () => ({ GITHUB_API_BASE_URL: "https://api.github.com" }));
vi.mock("@/config/env", () => ({ env: { githubToken: undefined } }));

// DetailPage の描画責務は detail.test.tsx が担保するためスタブ化し、
// ここでは「成功時に result.val が DetailPage へ渡る」配線だけを検証する。
vi.mock("./_components/DetailPage", () => ({
  DetailPage: ({ repo, backHref }: { repo: { fullName: string }; backHref?: string }) => (
    <div data-testid="detail-page" data-back-href={backHref}>
      {repo.fullName}
    </div>
  ),
}));

// notFound() は Next.js 内部と同様に throw するモックにする
vi.mock("next/navigation", () => ({
  notFound: vi.fn().mockImplementation(() => {
    throw new Error("NEXT_NOT_FOUND");
  }),
}));

import { notFound } from "next/navigation";
import DetailPageRoute from "./page";

beforeEach(() => {
  mocks.execute.mockReset();
  // notFound モックの呼び出し履歴をテスト間で持ち越さない（実装は throw のまま維持したいので clear）
  vi.mocked(notFound).mockClear();
});

afterEach(() => {
  cleanup();
});

describe("DetailPageRoute（page.tsx）", () => {
  it("execute が RepoNotFoundError を返したとき notFound() が呼ばれること", async () => {
    // Arrange
    mocks.execute.mockResolvedValue(err(new RepoNotFoundError()));

    // Act & Assert
    // notFound() は throw するので page.tsx の Promise は reject される
    await expect(
      DetailPageRoute({
        params: Promise.resolve({ owner: "octocat", repo: "Hello-World" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toThrow("NEXT_NOT_FOUND");

    expect(notFound).toHaveBeenCalled();
  });

  it("execute が RepoNotFoundError 以外の err を返すとき → notFound() せず throw して error.tsx に委譲すること", async () => {
    // Arrange
    mocks.execute.mockResolvedValue(err(new ExternalServiceError()));

    // Act & Assert
    await expect(
      DetailPageRoute({
        params: Promise.resolve({ owner: "octocat", repo: "Hello-World" }),
        searchParams: Promise.resolve({}),
      })
    ).rejects.toBeInstanceOf(ExternalServiceError);

    expect(notFound).not.toHaveBeenCalled();
  });

  it("execute が ok を返すとき → result.val を DetailPage に渡して描画すること", async () => {
    // Arrange
    mocks.execute.mockResolvedValue(ok({ fullName: "octocat/Hello-World" }));

    // Act
    render(
      await DetailPageRoute({
        params: Promise.resolve({ owner: "octocat", repo: "Hello-World" }),
        searchParams: Promise.resolve({}),
      })
    );

    // Assert
    expect(screen.getByTestId("detail-page")).toHaveTextContent("octocat/Hello-World");
    expect(notFound).not.toHaveBeenCalled();
  });

  it("searchParams に q・page があるとき → 検索状態を復元した backHref を DetailPage に渡すこと", async () => {
    // Arrange
    mocks.execute.mockResolvedValue(ok({ fullName: "octocat/Hello-World" }));

    // Act
    render(
      await DetailPageRoute({
        params: Promise.resolve({ owner: "octocat", repo: "Hello-World" }),
        searchParams: Promise.resolve({ q: "react", page: "2" }),
      })
    );

    // Assert
    expect(screen.getByTestId("detail-page")).toHaveAttribute("data-back-href", "/?q=react&page=2");
  });

  it("searchParams が空のとき → backHref はトップ（/）になること", async () => {
    // Arrange
    mocks.execute.mockResolvedValue(ok({ fullName: "octocat/Hello-World" }));

    // Act
    render(
      await DetailPageRoute({
        params: Promise.resolve({ owner: "octocat", repo: "Hello-World" }),
        searchParams: Promise.resolve({}),
      })
    );

    // Assert
    expect(screen.getByTestId("detail-page")).toHaveAttribute("data-back-href", "/");
  });
});
