import { describe, it, expect, vi, afterEach } from "vitest";
import { route } from "./route";

/**
 * Unit tests for the `route` URL builder.
 *
 * Query-string assertions mirror the internal `simpleUrl` helper exactly:
 *   - no query (or empty query) -> bare pathname.
 *   - scalar params -> `?key=value` with both key and value encodeURIComponent'd.
 *   - multiple params -> joined with `&`, preserving insertion order.
 *   - array params -> repeated `key=value` pairs (one per item).
 *   - null/undefined values are skipped entirely.
 */
describe("route", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("maps each route type to its pathname", () => {
    expect(route({ type: "HOME" })).toBe("/");
    expect(route({ type: "PLAYERS" })).toBe("/players");
    expect(route({ type: "USER_ACCESS" })).toBe("/user-access");
    expect(route({ type: "STUDIO" })).toBe("/studio");
    expect(route({ type: "APPLICATION_SETTINGS" })).toBe(
      "/application-settings",
    );
    expect(route({ type: "REPORTS" })).toBe("/reports");
    expect(route({ type: "SETTINGS" })).toBe("/settings");
    expect(route({ type: "ORGANIZATIONS" })).toBe("/organizations");
    expect(route({ type: "CLUBS" })).toBe("/clubs");
    expect(route({ type: "TOURNAMENTS" })).toBe("/tournaments");
    expect(route({ type: "MATCHES" })).toBe("/matches");
  });

  it("returns the bare pathname when query is omitted or empty", () => {
    expect(route({ type: "PLAYERS" })).toBe("/players");
    expect(route({ type: "PLAYERS", query: {} })).toBe("/players");
  });

  it("appends a single scalar query param after '?'", () => {
    expect(route({ type: "PLAYERS", query: { page: 2 } })).toBe(
      "/players?page=2",
    );
  });

  it("joins multiple query params with '&' in insertion order", () => {
    expect(
      route({ type: "TOURNAMENTS", query: { page: 1, size: 20 } }),
    ).toBe("/tournaments?page=1&size=20");
  });

  it("encodes keys and values", () => {
    expect(
      route({ type: "PLAYERS", query: { "full name": "John Doe" } }),
    ).toBe("/players?full%20name=John%20Doe");
  });

  it("expands array values into repeated key=value pairs", () => {
    expect(
      route({ type: "MATCHES", query: { status: ["live", "done"] } }),
    ).toBe("/matches?status=live&status=done");
  });

  it("drops null/undefined items inside array values", () => {
    // The array branch filters out nullish items before mapping.
    expect(
      route({
        type: "MATCHES",
        query: { status: ["live", null, undefined, "done"] as unknown as string[] },
      }),
    ).toBe("/matches?status=live&status=done");
  });

  it("omits an array param entirely when it has no valid items", () => {
    // Empty array -> the array branch produces no parts, so no query is added.
    expect(route({ type: "MATCHES", query: { status: [] } })).toBe("/matches");
    expect(
      route({ type: "MATCHES", query: { status: [null, undefined] as unknown as string[] } }),
    ).toBe("/matches");
  });

  it("skips null and undefined values", () => {
    expect(
      route({
        type: "CLUBS",
        query: { city: "Kyiv", region: null, district: undefined },
      }),
    ).toBe("/clubs?city=Kyiv");
  });

  it("returns the bare pathname when every value is null/undefined", () => {
    expect(route({ type: "CLUBS", query: { a: null, b: undefined } })).toBe(
      "/clubs",
    );
  });

  it("falls back to '/' and logs for an unknown route type", () => {
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    // Cast through unknown to exercise the exhaustive-check fallback branch.
    const result = route({ type: "NOPE" } as unknown as Parameters<
      typeof route
    >[0]);

    expect(result).toBe("/");
    expect(errorSpy).toHaveBeenCalledOnce();
  });
});
