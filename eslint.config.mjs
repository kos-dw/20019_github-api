import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import prettier from "eslint-config-prettier/flat";
import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  prettier,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "coverage",
    "node_modules",
  ]),
  {
    name: "domain-boundaries/route-groups",
    files: ["src/app/(search)/**/*", "src/app/(detail)/**/*"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: [
            {
              // (search) の部屋にいるときは、(detail) からのインポートを禁止
              group: ["**/[(]detail[)]/**", "@/(detail)/**"],
              message:
                "検索コンテキスト(search)から詳細コンテキスト(detail)のコードを直接参照することは禁止されています。共通処理は _shared/github に移動してください。",
            },
            {
              // (detail) の部屋にいるときは、(search) からのインポートを禁止
              group: ["**/[(]search[)]/**", "@/(search)/**"],
              message:
                "詳細コンテキスト(detail)から検索コンテキスト(search)のコードを直接参照することは禁止されています。共通処理は _shared/github に移動してください。",
            },
          ],
        },
      ],
    },
  },
]);

export default eslintConfig;
