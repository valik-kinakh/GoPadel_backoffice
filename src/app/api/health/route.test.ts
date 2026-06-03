import { describe, it, expect } from "vitest";
import { GET, dynamic } from "@/app/api/health/route";

/**
 * Integration-style test of the App Router health endpoint. Invokes the GET
 * handler directly (no HTTP server) and inspects the returned NextResponse.
 */
describe("GET /api/health", () => {
  it("is marked force-dynamic", () => {
    expect(dynamic).toBe("force-dynamic");
  });

  it("responds 200 with status 'ok'", async () => {
    const res = await GET();

    expect(res.status).toBe(200);

    const body = await res.json();
    expect(body.status).toBe("ok");
  });

  it("returns an ISO-8601 timestamp and a numeric uptime", async () => {
    const res = await GET();
    const body = await res.json();

    // toISOString() round-trips back to the same instant.
    expect(new Date(body.timestamp).toISOString()).toBe(body.timestamp);
    expect(typeof body.uptime).toBe("number");
    expect(body.uptime).toBeGreaterThanOrEqual(0);
  });
});
