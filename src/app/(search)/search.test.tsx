import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Pagination } from "./_components/Pagination";
import { SearchForm } from "./_components/SearchForm";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
  useSearchParams: () => new URLSearchParams("q=react&page=2"),
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

afterEach(() => {
  cleanup();
});

describe("SearchForm / Pagination の props・URL パラメータ反映", () => {
  it("useSearchParams の q が SearchForm の初期値に反映されること", () => {
    // Act
    render(<SearchForm />);

    // Assert
    expect(screen.getByPlaceholderText("リポジトリ名を入力してください")).toHaveValue("react");
  });

  it("Pagination の currentPage prop がページ表示に反映されること", () => {
    // Act
    render(<Pagination currentPage={2} totalCount={100} query="react" />);

    // Assert
    expect(screen.getByText("2 / 4")).toBeInTheDocument();
  });
});
