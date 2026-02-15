import { NextResponse } from "next/server";
import { markAllRead } from "@/lib/mockNotifications";

export async function POST() {
  const res = markAllRead();
  return NextResponse.json(res);
}