import path from "path";
import { defineConfig } from "rollup";
import terser from "@rollup/plugin-terser";
import babel from "@rollup/plugin-babel";
import resolve from "@rollup/plugin-node-resolve";
import commonjs from "@rollup/plugin-commonjs";

const babelConfig = babel({
  babelHelpers: "bundled",
  exclude: "node_modules/**",
});

export default defineConfig([
  {
    input: "src/index.js",
    output: [
      { file: "build/brahma.js", format: "esm", sourcemap: true },
      { file: "build/brahma.cjs", format: "cjs", sourcemap: true },
    ],
    external: ["three"],
    plugins: [resolve(), commonjs(), babelConfig, terser()],
  },
  {
    input: "src/server.js",
    output: [
      { file: "build/server.js", format: "esm", sourcemap: true },
      { file: "build/server.cjs", format: "cjs", sourcemap: true },
    ],
    external: [],
    plugins: [resolve(), commonjs(), babelConfig, terser()],
  },
]);
