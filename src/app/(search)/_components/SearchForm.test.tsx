import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SearchForm } from "./SearchForm";

const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
  useSearchParams: () => new URLSearchParams("q=react"),
}));

afterEach(() => {
  cleanup();
});

describe("SearchForm", () => {
  beforeEach(() => {
    mockPush.mockClear();
  });

  it("入力して submit するとトリム済みキーワードの URL で router.push が呼ばれること", () => {
    // Arrange
    render(<SearchForm />);
    const input = screen.getByPlaceholderText("リポジトリ名を入力してください");

    // Act
    fireEvent.change(input, { target: { value: "  next.js  " } });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    // Assert
    expect(mockPush).toHaveBeenCalledWith("/?q=next.js&page=1");
  });

  it("空白のみのとき router.push を呼ばずバリデーションを表示すること", () => {
    // Arrange
    render(<SearchForm />);
    const input = screen.getByPlaceholderText("リポジトリ名を入力してください");

    // Act
    fireEvent.change(input, { target: { value: "   " } });
    fireEvent.click(screen.getByRole("button", { name: "検索" }));

    // Assert
    expect(mockPush).not.toHaveBeenCalled();
    expect(screen.getByRole("alert")).toHaveTextContent("検索キーワードを入力してください。");
  });

  it("Enter キーで submit できること", () => {
    // Arrange
    render(<SearchForm />);
    const form = screen.getByRole("searchbox").closest("form");
    const input = screen.getByPlaceholderText("リポジトリ名を入力してください");

    // Act
    fireEvent.change(input, { target: { value: "vue" } });
    fireEvent.submit(form!);

    // Assert
    expect(mockPush).toHaveBeenCalledWith("/?q=vue&page=1");
  });
});
