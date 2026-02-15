import { NextResponse } from "next/server";
import { listProviders, maybeDelay } from "@/lib/mockSchedule";

export async function GET() {
  await maybeDelay(200, 500);
  return NextResponse.json(listProviders());
}