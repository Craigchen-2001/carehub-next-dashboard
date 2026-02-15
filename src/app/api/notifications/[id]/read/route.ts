import { NextResponse } from "next/server";
import { z } from "zod";
import { markRead } from "@/lib/mockNotifications";

const ParamsSchema = z.object({ id: z.string().min(1) });

export async function PUT(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const params = await ctx.params;
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) return NextResponse.json({ message: "Invalid id" }, { status: 400 });

  const changed = markRead(parsed.data.id);
  return NextResponse.json({ ok: true, changed });
}