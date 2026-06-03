/**
 * Global test setup, loaded once before the suite via vitest.config.ts.
 *
 * 1. Registers @testing-library/jest-dom custom matchers (e.g. toBeInTheDocument,
 *    toHaveClass) on Vitest's `expect`.
 * 2. Unmounts React trees rendered by React Testing Library after every test so
 *    state does not leak between tests sharing the same jsdom document.
 */
import "@testing-library/jest-dom/vitest";
import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

afterEach(() => {
  cleanup();
});
