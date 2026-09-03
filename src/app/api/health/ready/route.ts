import { checkApplicationReadiness } from "@server/readiness";

export async function GET(): Promise<Response> {
  try {
    await checkApplicationReadiness();
    return Response.json({ status: "READY" });
  } catch {
    return Response.json({ status: "NOT_READY" }, { status: 503 });
  }
}
