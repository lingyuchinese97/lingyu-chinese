import { NextResponse } from "next/server";
import { pool } from "@/server/db/pool";
import { log } from "@/server/log";

export const dynamic = "force-dynamic";

/** Healthcheck cho Docker/Caddy/uptime monitor: 200 khi DB trả lời, 503 khi không. */
export async function GET() {
  const started = Date.now();
  try {
    await pool.query("select 1");
    return NextResponse.json(
      { status: "ok", db: "ok", latencyMs: Date.now() - started },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (err) {
    log.error({ err: (err as Error).message }, "healthcheck: database unreachable");
    return NextResponse.json(
      { status: "error", db: "unreachable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
