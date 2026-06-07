import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { ExternalServiceError } from "@/app/_shared/github/errors";
import { err, ok } from "@/utils/result";

// vi.hoisted: vi.mock ファクトリより先に評価されるため、モック内で参照できる
const mocks = vi.hoisted(() => ({ execute: vi.fn() }));

// SearchRepos を class でモック（execute だけ差し替え、UseCase 本体の振る舞いは別テストが担保）
vi.mock("./_usecase/useCase", () => ({
  SearchRepos: class {
    execute = mocks.execute;
  },
}));

// page.tsx 内で DI 構築に使われる依存を差し替える
vi.mock("@/app/_shared/github/infra", () => ({ GitHubRepoStore: vi.fn() }));
vi.mock("@/libs/github/HttpClient", () => ({ GitHubHttpClient: vi.fn() }));
vi.mock("@/config/github", () => ({ GITHUB_API_BASE_URL: "https://api.github.com" }));
vi.mock("@/config/env", () => ({ env: { githubToken: undefined } }));

// 子コンポーネントの描画責務は RepoList.test / Pagination.test が担保するためスタブ化し、
// ここでは「どの分岐でどの子を出すか」だけを検証する。
vi.mock("./_components/RepoList", () => ({
  RepoList: ({ items }: { items: unknown[] }) => <div data-testid="repo-list">{items.length}</div>,
}));
vi.mock("./_components/Pagination", () => ({
  Pagination: () => <div data-testid="pagination" />,
}));

import { SearchResults } from "./page";

afterEach(() => {
  cleanup();
});

beforeEach(() => {
  mocks.execute.mockReset();
});

describe("SearchResults（page.tsx の検索結果分岐）", () => {
  it("空クエリのとき → 検索を実行せず未検索の案内文を表示すること", async () => {
    // Act
    render(await SearchResults({ query: "", page: 1 }));

    // Assert
    expect(screen.getByText("キーワードを入力して検索してください")).toBeInTheDocument();
    expect(mocks.execute).not.toHaveBeenCalled();
  });

  it("検索結果が 0 件のとき → 該当なしメッセージを表示すること", async () => {
    // Arrange
    mocks.execute.mockResolvedValue(ok({ items: [], totalCount: 0 }));

    // Act
    render(await SearchResults({ query: "react", page: 1 }));

    // Assert
    expect(screen.getByText("該当するリポジトリが見つかりませんでした")).toBeInTheDocument();
    expect(mocks.execute).toHaveBeenCalledWith({ query: "react", page: 1 });
  });

  it("検索結果があるとき → 一覧とページネーションを表示すること", async () => {
    // Arrange
    mocks.execute.mockResolvedValue(ok({ items: [{ id: 1 }, { id: 2 }], totalCount: 2 }));

    // Act
    render(await SearchResults({ query: "react", page: 2 }));

    // Assert
    expect(screen.getByTestId("repo-list")).toHaveTextContent("2");
    expect(screen.getByTestId("pagination")).toBeInTheDocument();
    expect(mocks.execute).toHaveBeenCalledWith({ query: "react", page: 2 });
  });

  it("Store が err を返すとき → throw して error.tsx に委譲すること", async () => {
    // Arrange
    mocks.execute.mockResolvedValue(err(new ExternalServiceError()));

    // Act & Assert
    await expect(SearchResults({ query: "react", page: 1 })).rejects.toBeInstanceOf(ExternalServiceError);
  });
});
