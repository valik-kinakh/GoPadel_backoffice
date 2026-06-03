/**
 * Vitest configuration (Vitest 4 API).
 *
 * - `@vitejs/plugin-react` enables JSX/TSX transform + React Fast Refresh semantics
 *   so component tests (e.g. Badge.test.tsx) compile and render correctly.
 * - `vite-tsconfig-paths` teaches Vitest about the `@/*` -> `./src/*` path alias
 *   declared in tsconfig.json, so test files can import via `@/...`.
 *
 * The suite runs in jsdom so React Testing Library has a DOM to render into.
 * Coverage is scoped to ONLY the four modules under test so the enforced
 * thresholds reflect real, intentional coverage rather than incidentally-touched
 * files. The `json-summary` reporter emits coverage/coverage-summary.json, which
 * the CI pipeline consumes.
 */
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    // Browser-like DOM environment for component rendering.
    environment: "jsdom",
    // Expose `describe`/`it`/`expect`/`vi` etc. without per-file imports.
    globals: true,
    // Runs once before the suite: jest-dom matchers + RTL cleanup hook.
    setupFiles: ["./vitest.setup.ts"],
    // Only collect *.test/*.spec files under src/.
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    coverage: {
      provider: "v8",
      // `json-summary` MUST be present so coverage/coverage-summary.json is written.
      reporter: ["text", "json-summary", "html"],
      reportsDirectory: "./coverage",
      // Scope coverage to exactly the four modules under test.
      include: [
        "src/lib/utils/api/buildInit.ts",
        "src/lib/router/route.ts",
        "src/components/ui/badge/Badge.tsx",
        "src/app/api/health/route.ts",
      ],
      // Enforced, non-zero thresholds. Set a few points below the achieved
      // numbers so the gate is meaningful but not flaky against minor edits.
      // Achieved by the starter suite: statements/functions/lines 100%,
      // branches 97.77%. Thresholds sit a few points below — enforced and
      // non-zero, but not flaky against minor refactors.
      thresholds: {
        lines: 95,
        functions: 95,
        statements: 95,
        branches: 92,
      },
    },
  },
});
