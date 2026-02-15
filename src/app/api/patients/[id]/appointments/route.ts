import { NextResponse } from "next/server";
import { z } from "zod";
import { appointments, getPatientById } from "@/lib/mockPatientDetail";

const ParamsSchema = z.object({ id: z.string().min(1) });

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const p = getPatientById(parsed.data.id);
  if (!p) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(appointments.filter((a) => a.patientId === p.id));
}