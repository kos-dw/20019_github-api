import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { Owner, Repo, RepoFullName, RepoStats } from "@/app/_shared/github/domain";
import { RepoListItem } from "./RepoListItem";

vi.mock("next/image", () => ({
  default: ({ src, alt }: { src: string; alt: string }) => <span role="img" aria-label={alt} data-src={src} />,
}));

vi.mock("next/link", () => ({
  default: ({ href, children }: { href: string; children: React.ReactNode }) => <a href={href}>{children}</a>,
}));

afterEach(() => {
  cleanup();
});

describe("RepoListItem", () => {
  const fullNameResult = RepoFullName.create("octocat", "Hello-World");
  if (!fullNameResult.ok) throw new Error("テストセットアップ失敗");

  const sampleRepo = new Repo({
    id: 1,
    fullName: fullNameResult.val,
    owner: new Owner("octocat", "https://example.com/avatar.gif"),
    stats: new RepoStats({ stars: 1, watchers: 1, forks: 1, issues: 1 }),
    language: "TypeScript",
  });

  it("アイコンと owner/repo 名が描画されること", () => {
    // Act
    render(<RepoListItem repo={sampleRepo} query="react" page={1} />);

    // Assert
    expect(screen.getByRole("img", { name: "octocatのアバター" })).toBeInTheDocument();
    expect(screen.getByText("octocat/Hello-World")).toBeInTheDocument();
  });

  it("リンク先が /{owner}/{repo} で、検索状態（q・page）がクエリに引き継がれること", () => {
    // Act
    render(<RepoListItem repo={sampleRepo} query="react" page={2} />);

    // Assert
    // 詳細から戻ったときに同じ検索結果・ページ位置を再現できるよう、状態を URL に載せる
    expect(screen.getByRole("link")).toHaveAttribute("href", "/octocat/Hello-World?q=react&page=2");
  });

  it("query にスペースや記号が含まれるときエンコードされること", () => {
    // Act
    render(<RepoListItem repo={sampleRepo} query="hello world" page={1} />);

    // Assert
    expect(screen.getByRole("link")).toHaveAttribute("href", "/octocat/Hello-World?q=hello+world&page=1");
  });
});
