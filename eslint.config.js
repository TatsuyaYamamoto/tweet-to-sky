import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import reactJsxRuntime from "eslint-plugin-react/configs/jsx-runtime.js";
import reactRecommended from "eslint-plugin-react/configs/recommended.js";

const compat = new FlatCompat();

export default [
  { ignores: ["build", ".plasmo", "eslint.config.js", ".prettierrc.mjs"] },
  js.configs.recommended,
  ...compat.extends("plugin:@typescript-eslint/recommended-type-checked"),
  ...compat.extends("plugin:@typescript-eslint/stylistic-type-checked"),
  ...compat.extends("plugin:@typescript-eslint/stylistic-type-checked"),
  {
    languageOptions: {
      parserOptions: {
        project: true,
      },
    },
  },
  reactRecommended,
  reactJsxRuntime,
  ...compat.extends("plugin:react-hooks/recommended"),

  {
    rules: {
      // https://github.com/orgs/react-hook-form/discussions/9325#discussioncomment-4060566
      "@typescript-eslint/no-misused-promises": [
        2,
        {
          checksVoidReturn: {
            attributes: false,
          },
        },
      ],
    },
  },
];
