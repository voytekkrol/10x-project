import { includeIgnoreFile } from "@eslint/compat";
import eslint from "@eslint/js";
import eslintPluginPrettier from "eslint-plugin-prettier/recommended";
import eslintPluginAstro from "eslint-plugin-astro";
import jsxA11y from "eslint-plugin-jsx-a11y";
import pluginReact from "eslint-plugin-react";
import reactCompiler from "eslint-plugin-react-compiler";
import eslintPluginReactHooks from "eslint-plugin-react-hooks";
import path from "node:path";
import { fileURLToPath } from "node:url";
import tseslint from "typescript-eslint";

// File path setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const gitignorePath = path.resolve(__dirname, ".gitignore");

const baseConfig = tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.strict,
  ...tseslint.configs.stylistic,
  {
    rules: {
      "no-console": "warn",
      "no-unused-vars": "off",
    },
  }
);

const nodeConfig = tseslint.config({
  files: ["**/*.js", "setup-tests.js", "*.config.*"],
  languageOptions: {
    globals: {
      console: "readonly",
      process: "readonly",
      Buffer: "readonly",
      __dirname: "readonly",
      __filename: "readonly",
      global: "readonly",
      module: "readonly",
      require: "readonly",
      exports: "readonly",
    },
  },
});

const jsxA11yConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  plugins: {
    "jsx-a11y": jsxA11y,
  },
  languageOptions: {
    ...jsxA11y.flatConfigs.recommended.languageOptions,
  },
  rules: {
    ...jsxA11y.flatConfigs.recommended.rules,
  },
});

const reactConfig = tseslint.config({
  files: ["**/*.{js,jsx,ts,tsx}"],
  plugins: {
    react: pluginReact,
    "react-hooks": eslintPluginReactHooks,
    "react-compiler": reactCompiler,
  },
  languageOptions: {
    ...pluginReact.configs.flat.recommended.languageOptions,
    globals: {
      window: "readonly",
      document: "readonly",
    },
  },
  settings: { react: { version: "detect" } },
  rules: {
    ...pluginReact.configs.flat.recommended.rules,
    ...eslintPluginReactHooks.configs.recommended.rules,
    "react/react-in-jsx-scope": "off",
    "react-compiler/react-compiler": "error",
  },
});

const astroPrettierOff = tseslint.config({
  files: ["src/pages/**/register.astro", "src/pages/**/generate.astro", "src/pages/**/confirm.astro"],
  rules: {
    "prettier/prettier": "off",
  },
});

export default tseslint.config(
  includeIgnoreFile(gitignorePath),
  {
    ignores: ["test-generation-endpoint.js"],
  },
  baseConfig,
  nodeConfig,
  jsxA11yConfig,
  reactConfig,
  eslintPluginAstro.configs["flat/recommended"],
  eslintPluginPrettier,
  astroPrettierOff
);
