import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Owner, Repo, RepoFullName, RepoStats } from "@/app/_shared/github/domain";
import { RepoList } from "./RepoList";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <span role="img" aria-label={alt} data-src={src} />,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

afterEach(() => {
  cleanup();
});

describe("RepoList", () => {
  const makeRepo = (id: number, owner: string, repo: string) => {
    const nameResult = RepoFullName.create(owner, repo);
    if (!nameResult.ok) throw new Error("テストセットアップ失敗");

    return new Repo({
      id,
      fullName: nameResult.val,
      owner: new Owner(owner, "https://example.com/avatar.gif"),
      stats: new RepoStats({ stars: 1, watchers: 1, forks: 1, issues: 1 }),
      language: null,
    });
  };

  it("items があるとき各要素がリンクとして描画されること", () => {
    // Arrange
    const items = [makeRepo(1, "octocat", "Hello-World"), makeRepo(2, "facebook", "react")];

    // Act
    render(<RepoList items={items} query="test" page={1} />);

    // Assert
    expect(screen.getByRole("link", { name: /octocat\/Hello-World/ })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /facebook\/react/ })).toBeInTheDocument();
  });

  it("空配列のときリスト項目が描画されないこと", () => {
    // Act
    render(<RepoList items={[]} query="test" page={1} />);

    // Assert
    expect(screen.queryByRole("listitem")).not.toBeInTheDocument();
  });
});
