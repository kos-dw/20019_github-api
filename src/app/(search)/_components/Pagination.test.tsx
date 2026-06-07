import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DEFAULT_PER_PAGE, SEARCH_RESULT_HARD_LIMIT } from "@/config/github";
import { Pagination } from "./Pagination";

const MAX_PAGE_BY_LIMIT = Math.floor(SEARCH_RESULT_HARD_LIMIT / DEFAULT_PER_PAGE);

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

afterEach(() => {
  cleanup();
});

describe("Pagination", () => {
  it("次へリンクが正しい URL を持つこと", () => {
    // Arrange
    render(<Pagination currentPage={1} totalCount={100} query="react" />);

    // Assert
    expect(screen.getByRole("link", { name: "次へ" })).toHaveAttribute("href", "/?q=react&page=2");
  });

  it("前へリンクが正しい URL を持つこと", () => {
    // Arrange
    render(<Pagination currentPage={2} totalCount={100} query="react" />);

    // Assert
    expect(screen.getByRole("link", { name: "前へ" })).toHaveAttribute("href", "/?q=react&page=1");
  });

  it("1 ページ目では前へリンクが表示されず disabled 表示になること", () => {
    // Arrange
    render(<Pagination currentPage={1} totalCount={100} query="react" />);

    // Assert
    expect(screen.queryByRole("link", { name: "前へ" })).not.toBeInTheDocument();
    expect(screen.getByText("前へ")).toHaveAttribute("aria-disabled", "true");
  });

  it("最終ページでは次へリンクが表示されず disabled 表示になること", () => {
    // Arrange
    const totalCount = 60;
    const maxPage = Math.ceil(totalCount / DEFAULT_PER_PAGE);
    render(<Pagination currentPage={maxPage} totalCount={totalCount} query="react" />);

    // Assert
    expect(screen.queryByRole("link", { name: "次へ" })).not.toBeInTheDocument();
    expect(screen.getByText("次へ")).toHaveAttribute("aria-disabled", "true");
  });

  it("1,000 件上限で最大ページが制限されること", () => {
    // Arrange
    render(<Pagination currentPage={MAX_PAGE_BY_LIMIT} totalCount={10000} query="react" />);

    // Assert
    expect(screen.getByText(`${MAX_PAGE_BY_LIMIT} / ${MAX_PAGE_BY_LIMIT}`)).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: "次へ" })).not.toBeInTheDocument();
  });
});
