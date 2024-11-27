import eslintJs from "@eslint/js"
import globals from "globals"
import tsEslint from "typescript-eslint"
import simpleImportSort from "eslint-plugin-simple-import-sort"
import importPlugin from "eslint-plugin-import"

export default [
  {
    ignores: ["dist/", "eslint.config.mjs"],
  },
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
    },
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
  ...tsEslint.configs.recommendedTypeChecked,
  importPlugin.flatConfigs.recommended,
  {
    rules: {
      eqeqeq: "error",
      "object-shorthand": "error",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],
      "simple-import-sort/imports": "error",
      "import/no-unresolved": "off",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
    },
  },
]
