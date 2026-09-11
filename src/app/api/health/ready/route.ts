import { checkApplicationReadiness } from "@server/readiness";
import { connection } from "next/server";

export async function GET(): Promise<Response> {
  await connection();

  try {
    await checkApplicationReadiness();
    return Response.json({ status: "READY" });
  } catch {
    return Response.json({ status: "NOT_READY" }, { status: 503 });
  }
}
