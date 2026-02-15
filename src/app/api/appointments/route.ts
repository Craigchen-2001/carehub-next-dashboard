import { NextResponse } from "next/server";
import { z } from "zod";
import { listAppointments, maybeDelay, maybeFail } from "@/lib/mockSchedule";

const QuerySchema = z.object({
  start: z.string().min(1),
  end: z.string().min(1),
  provider: z.string().optional(),
  room: z.string().optional(),
});

export async function GET(req: Request) {
  await maybeDelay(200, 500);
  if (maybeFail(5)) return NextResponse.json({ message: "Temporary error" }, { status: 503 });

  const url = new URL(req.url);
  const parsed = QuerySchema.safeParse({
    start: url.searchParams.get("start") || "",
    end: url.searchParams.get("end") || "",
    provider: url.searchParams.get("provider") || undefined,
    room: url.searchParams.get("room") || undefined,
  });

  if (!parsed.success) return NextResponse.json({ message: "Invalid query", issues: parsed.error.issues }, { status: 400 });

  const data = listAppointments({
    start: parsed.data.start,
    end: parsed.data.end,
    providerId: parsed.data.provider,
    room: parsed.data.room,
  });

  return NextResponse.json({ data });
}