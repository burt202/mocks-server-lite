import eslintJs from "@eslint/js"
import globals from "globals"
import tsEslint from "typescript-eslint"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import importPlugin from "eslint-plugin-import"

export default [
  {
    ignores: ["dist/", "eslint.config.mjs", "prettier.config.mjs"],
  },
  {
    languageOptions: {
      parser: tsEslint.parser,
      ecmaVersion: 2023,
      sourceType: "script",
      parserOptions: {
        project: "./tsconfig.json",
      },
      globals: {...globals.node},
    },
  },
  eslintJs.configs.recommended,
  ...tsEslint.configs.recommended,
  ...tsEslint.configs.strictTypeChecked,
  importPlugin.flatConfigs.recommended,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
    rules: {
      complexity: ["error", {max: 15}],
      eqeqeq: "error",
      "no-console": ["warn", {allow: ["info", "warn", "error"]}],
      "object-shorthand": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/no-unresolved": "off",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
      "@typescript-eslint/restrict-template-expressions": "off",
      "@typescript-eslint/no-confusing-void-expression": "off",
      "@typescript-eslint/no-unnecessary-type-parameters": "off",
      "@typescript-eslint/no-unnecessary-condition": "off",
    },
  },
]
