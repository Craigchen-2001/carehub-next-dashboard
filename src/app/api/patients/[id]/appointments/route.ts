import { NextResponse } from "next/server";
import { z } from "zod";
import { addAppointment, getPatientById, listAppointments } from "@/lib/mockPatientDetail";
import { addNotification } from "@/lib/mockNotifications";

const ParamsSchema = z.object({ id: z.string().min(1) });

const BodySchema = z.object({
  startTime: z.string().min(1),
  endTime: z.string().min(1),
  providerId: z.string().min(1),
  status: z.enum(["scheduled", "completed", "cancelled", "no-show"]),
  type: z.enum(["in-person", "telehealth"]),
});

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const p = getPatientById(parsed.data.id);
  if (!p) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(listAppointments(p.id));
}

export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const p = getPatientById(parsed.data.id);
  if (!p) return NextResponse.json({ message: "Not found" }, { status: 404 });

  const json = await req.json().catch(() => null);
  const body = BodySchema.safeParse(json);
  if (!body.success) return NextResponse.json({ message: "Invalid body", issues: body.error.issues }, { status: 400 });

  const created = addAppointment(p.id, body.data);

  addNotification({
    type: "appointment_update",
    title: "Appointment created",
    body: `${p.firstName} ${p.lastName} · ${created.type} · ${created.status}`,
  });

  return NextResponse.json(created, { status: 201 });
}