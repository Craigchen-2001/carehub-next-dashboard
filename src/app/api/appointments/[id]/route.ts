import { NextResponse } from "next/server";
import { z } from "zod";
import { maybeDelay, updateAppointment } from "@/lib/mockSchedule";

const ParamsSchema = z.object({ id: z.string().min(1) });

const BodySchema = z.object({
  startTime: z.string().optional(),
  endTime: z.string().optional(),
  providerId: z.string().optional(),
  room: z.string().optional(),
  status: z.enum(["scheduled", "completed", "cancelled", "no-show"]).optional(),
});

export async function PUT(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  await maybeDelay(200, 500);

  const json = await req.json().catch(() => null);
  const body = BodySchema.safeParse(json);
  if (!body.success) return NextResponse.json({ message: "Invalid body", issues: body.error.issues }, { status: 400 });

  const updated = updateAppointment(parsed.data.id, body.data);
  if (!updated) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(updated);
}