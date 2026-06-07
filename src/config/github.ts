// 本番は GitHub 本体。E2E では環境変数でローカルのモックサーバーに向ける（Server Component の
// fetch はサーバー側で走るため page.route() では奪えず、向き先の差し替えで密閉する）。
export const GITHUB_API_BASE_URL = process.env.GITHUB_API_BASE_URL ?? "https://api.github.com";
export const GITHUB_API_VERSION = "2022-11-28";
export const DEFAULT_PER_PAGE = 30;
export const DEFAULT_REVALIDATE_SECONDS = 60;
export const SEARCH_RESULT_HARD_LIMIT = 1000;
