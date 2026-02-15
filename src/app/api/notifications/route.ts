import { NextResponse } from "next/server";
import { listNotifications, unreadCount } from "@/lib/mockNotifications";

export async function GET() {
  return NextResponse.json({
    unreadCount: unreadCount(),
    data: listNotifications(),
  });
}