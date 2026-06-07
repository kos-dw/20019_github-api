// E2E 用の固定レスポンス。GitHub REST API の DTO 形（src/libs/github/dto.ts）に合わせる。
// モックサーバー（mock-server.mjs）と spec（search.spec.ts）の両方から参照し、
// 期待値を一箇所に集約してズレを防ぐ。

/** @type {import("../src/libs/github/dto").GitHubRepoDto} */
export const repoDetail = {
  id: 10270250,
  name: "react",
  full_name: "facebook/react",
  owner: {
    login: "facebook",
    // remotePatterns（next.config.ts）で許可済みのホスト。未許可だと next/image が throw する。
    avatar_url: "https://avatars.githubusercontent.com/u/69631?v=4",
  },
  language: "JavaScript",
  // 3 桁区切り表示（toLocaleString("ja-JP")）を検証できるよう、桁の多い一意な値にする。
  stargazers_count: 123456,
  subscribers_count: 7890,
  forks_count: 4567,
  open_issues_count: 89,
};

/** @type {import("../src/libs/github/dto").GitHubSearchReposDto} */
export const searchResponse = {
  total_count: 1,
  incomplete_results: false,
  items: [repoDetail],
};
