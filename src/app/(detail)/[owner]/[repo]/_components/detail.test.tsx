import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Owner, Repo, RepoFullName, RepoStats } from "@/app/_shared/github/domain";
import { DetailPage } from "./DetailPage";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <span role="img" aria-label={alt} data-src={src} />,
}));

afterEach(() => {
  cleanup();
});

const makeRepo = (overrides?: Partial<{ language: string | null; stars: number }>) => {
  const fullNameResult = RepoFullName.create("octocat", "Hello-World");
  if (!fullNameResult.ok) throw new Error("テストセットアップ失敗");

  return new Repo({
    id: 1296269,
    fullName: fullNameResult.val,
    owner: new Owner("octocat", "https://github.com/images/error/octocat_happy.gif"),
    stats: new RepoStats({
      stars: overrides?.stars ?? 80,
      watchers: 42,
      forks: 9,
      issues: 0,
    }),
    language: overrides?.language !== undefined ? overrides.language : "TypeScript",
  });
};

describe("DetailPage", () => {
  it("全項目が描画されること", () => {
    // Arrange
    const repo = makeRepo();

    // Act
    render(<DetailPage repo={repo} />);

    // Assert
    expect(screen.getByRole("img", { name: "octocatのアバター" })).toBeInTheDocument();
    expect(screen.getByText("octocat/Hello-World")).toBeInTheDocument();
    expect(screen.getByText("TypeScript")).toBeInTheDocument();
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("42")).toBeInTheDocument();
    expect(screen.getByText("9")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("language が null のとき「-」が表示されること", () => {
    // Arrange
    const repo = makeRepo({ language: null });

    // Act
    render(<DetailPage repo={repo} />);

    // Assert
    expect(screen.getByText("-")).toBeInTheDocument();
  });

  it("大きな数値が 3 桁区切りで表示されること", () => {
    // Arrange
    const repo = makeRepo({ stars: 12345 });

    // Act
    render(<DetailPage repo={repo} />);

    // Assert
    expect(screen.getByText("12,345")).toBeInTheDocument();
  });

  it("backHref を渡したとき、戻りリンクがその URL を指すこと", () => {
    // Arrange
    const repo = makeRepo();

    // Act
    render(<DetailPage repo={repo} backHref="/?q=react&page=2" />);

    // Assert
    // 一覧の検索状態に戻れることを担保する
    expect(screen.getByRole("link", { name: /トップへ戻る/ })).toHaveAttribute("href", "/?q=react&page=2");
  });

  it("backHref を渡さないとき、戻りリンクはトップ（/）を指すこと", () => {
    // Arrange
    const repo = makeRepo();

    // Act
    render(<DetailPage repo={repo} />);

    // Assert
    expect(screen.getByRole("link", { name: /トップへ戻る/ })).toHaveAttribute("href", "/");
  });
});
