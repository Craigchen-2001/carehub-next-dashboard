import { NextResponse } from "next/server";
import { z } from "zod";
import { addNote, getPatientById, listNotes } from "@/lib/mockPatientDetail";

const ParamsSchema = z.object({ id: z.string().min(1) });
const BodySchema = z.object({ author: z.string().min(1), text: z.string().min(1) });

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const p = getPatientById(parsed.data.id);
  if (!p) return NextResponse.json({ message: "Not found" }, { status: 404 });

  return NextResponse.json(listNotes(p.id));
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

  const created = addNote(p.id, body.data.author, body.data.text);
  return NextResponse.json(created, { status: 201 });
}