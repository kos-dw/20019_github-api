import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["@testing-library/jest-dom/vitest"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}", // テストコード自体
        "src/**/dto.ts", // レスポンス DTO（型定義のみ）
        "src/utils/result.ts", // Result 型ユーティリティ（型定義のみ）
        "src/config/**", // 定数・環境変数アクセス
        "src/app/**/layout.tsx", // ルート骨組み（表示のみ）
        "src/app/**/loading.tsx", // ローディング UI（表示のみ）
        "src/app/**/error.tsx", // エラー UI（表示のみ）
        "src/app/**/not-found.tsx", // 404 UI（表示のみ）
      ],
    },
  },
});
