import { NextResponse } from "next/server";
import { getProviderSchedule, maybeDelay } from "@/lib/mockSchedule";

export async function GET(_: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  await maybeDelay(200, 500);
  const s = getProviderSchedule(id);
  if (!s) return NextResponse.json({ message: "Not found" }, { status: 404 });
  return NextResponse.json(s);
}