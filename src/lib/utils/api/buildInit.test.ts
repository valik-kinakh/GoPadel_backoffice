import { describe, it, expect } from "vitest";
import { buildInit } from "./buildInit";

/**
 * Unit tests for buildInit — the helper that shapes a fetch RequestInit.
 * Asserts only behavior observable from the source:
 *   - `method` is passed straight through.
 *   - `body` is JSON.stringify(axiosData) when data is provided.
 *   - `body` is `undefined` when no data (or falsy data) is provided.
 *   - `headers` are passed straight through.
 */
describe("buildInit", () => {
  it("passes the HTTP method through unchanged", () => {
    expect(buildInit("GET").method).toBe("GET");
    expect(buildInit("POST").method).toBe("POST");
    expect(buildInit("DELETE").method).toBe("DELETE");
  });

  it("JSON.stringifies the body when data is provided", () => {
    const data = { id: 1, name: "court" };
    const init = buildInit("POST", data);

    expect(init.body).toBe(JSON.stringify(data));
    // Round-trips back to the original object.
    expect(JSON.parse(init.body as string)).toEqual(data);
  });

  it("stringifies array payloads as well", () => {
    const data = [1, 2, 3];
    expect(buildInit("PUT", data).body).toBe("[1,2,3]");
  });

  it("sets body to undefined when no data is passed", () => {
    expect(buildInit("GET").body).toBeUndefined();
  });

  it("sets body to undefined for falsy data (e.g. null)", () => {
    // The source uses a truthiness check (`axiosData ? ... : undefined`),
    // so null / 0 / "" all yield an undefined body.
    expect(buildInit("GET", null).body).toBeUndefined();
    expect(buildInit("GET", 0).body).toBeUndefined();
    expect(buildInit("GET", "").body).toBeUndefined();
  });

  it("passes headers through unchanged", () => {
    const headers = { "Content-Type": "application/json", "X-Token": "abc" };
    const init = buildInit("POST", { a: 1 }, headers);

    expect(init.headers).toBe(headers);
  });

  it("leaves headers undefined when none are provided", () => {
    expect(buildInit("GET").headers).toBeUndefined();
  });
});
