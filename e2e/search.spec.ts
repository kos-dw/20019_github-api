import { AxeBuilder } from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { repoDetail } from "./fixtures.mjs";

// ハッピーパス 1 本でテストピラミッドの頂点（ユーザー操作フロー全体）を保証する。
// GitHub API はローカルのモックサーバー（webServer で起動）に向けているため決定論的。
test("検索キーワード入力から一覧・詳細表示、トップ復帰までのハッピーパス", async ({ page }) => {
  // Arrange: 期待値はモックと共有する fixture から取得する（マジックストリングを避ける）。
  const { full_name: fullName, language, stargazers_count: stars } = repoDetail;

  // Act: トップで検索キーワードを入力し検索を実行する。
  await page.goto("/");
  await page.getByLabel("検索キーワード").fill("react");
  await page.getByRole("button", { name: "検索" }).click();

  // Assert: 一覧に対象リポジトリが表示される。
  const repoLink = page.getByRole("link", { name: fullName });
  await expect(repoLink).toBeVisible();

  // Act: アクセシビリティスキャンを実行する。
  const homeAccessibilityScanResults = await new AxeBuilder({ page }).analyze();

  // Assert: アクセシビリティ違反がないことを確認する。
  expect(homeAccessibilityScanResults.violations).toEqual([]);

  // Act: リポジトリをクリックして詳細ページへ遷移する。
  await repoLink.click();

  // Assert: 詳細ページに遷移し、詳細情報が表示される。
  // 一覧から引き継いだ検索状態（q / page）が URL に付与される。
  await expect(page).toHaveURL(`/${fullName}?q=react&page=1`);
  await expect(page.getByRole("heading", { name: "リポジトリ詳細" })).toBeVisible();
  await expect(page.getByText(language ?? "-")).toBeVisible();
  await expect(page.getByText(stars.toLocaleString("ja-JP"))).toBeVisible();

  // Act: アクセシビリティスキャンを実行する。
  const detailAccessibilityScanResults = await new AxeBuilder({ page }).analyze();

  // Assert: アクセシビリティ違反がないことを確認する。
  expect(detailAccessibilityScanResults.violations).toEqual([]);

  // Act: 「トップへ戻る」で一覧へ戻る。
  await page.getByRole("link", { name: "トップへ戻る" }).click();

  // Assert: 検索状態（q / page）を保持したまま一覧へ戻っている。
  await expect(page).toHaveURL("/?q=react&page=1");
  await expect(page.getByRole("heading", { name: "GitHub リポジトリ検索" })).toBeVisible();
  await expect(repoLink).toBeVisible();
});
