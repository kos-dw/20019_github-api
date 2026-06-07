/**
 * @see https://prettier.io/docs/configuration
 * @type {import("prettier").Config & import('prettier-plugin-tailwindcss').PluginOptions}
 */
const config = {
  plugins: ["prettier-plugin-tailwindcss"],
  trailingComma: "es5",
  printWidth: 120,
  tabWidth: 2,
  semi: true,
};

export default config;
