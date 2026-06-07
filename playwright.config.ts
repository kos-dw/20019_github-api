import { defineConfig, devices } from "@playwright/test";

const APP_PORT = 3000;
const MOCK_PORT = 4000;
const BASE_URL = `http://localhost:${APP_PORT}`;
const MOCK_URL = `http://localhost:${MOCK_PORT}`;

export default defineConfig({
  testDir: "./e2e",
  // .mjs（fixtures / mock-server）はテストではないので拾わない。spec のみ対象にする。
  testMatch: /.*\.spec\.ts$/,
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  // next dev は初回ルートアクセス時にオンデマンドコンパイルが走り遅いことがあるため、
  // cold start でのフレークを避けて少し緩める。
  timeout: 60_000,
  expect: { timeout: 10_000 },
  use: {
    baseURL: BASE_URL,
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // 起動順・待機・終了を Playwright に委ねる。モック → Next の 2 プロセスを管理させる。
  webServer: [
    {
      command: "node e2e/mock-server.mjs",
      // /search/repositories が 200 を返せたら起動完了とみなす。
      url: `${MOCK_URL}/search/repositories`,
      reuseExistingServer: !process.env.CI,
      env: { MOCK_PORT: String(MOCK_PORT) },
    },
    {
      command: "npm run dev",
      url: BASE_URL,
      reuseExistingServer: !process.env.CI,
      // Server Component の fetch をモックに向ける肝。本番のデフォルト URL を上書きする。
      env: { GITHUB_API_BASE_URL: MOCK_URL },
    },
  ],
});
