import { NextResponse } from "next/server";

/**
 * Health-check endpoint for deploy smoke checks.
 *
 * `force-dynamic` opts the route out of static optimization so it is evaluated
 * on every request (the response must reflect live process state, not a build
 * snapshot). The blue-green production deploy and CI smoke checks hit GET
 * /api/health and expect HTTP 200 with `status: "ok"`.
 *
 * Note: package.json is intentionally NOT imported here to avoid
 * resolveJsonModule / bundling concerns in the route handler.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(
    {
      status: "ok",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
    },
    { status: 200 },
  );
}
