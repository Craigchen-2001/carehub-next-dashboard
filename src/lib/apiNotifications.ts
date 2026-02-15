import { z } from "zod";

const NotificationSchema = z.object({
  id: z.string(),
  ts: z.string(),
  type: z.enum(["appointment_update", "patient_alert", "message"]),
  title: z.string(),
  body: z.string(),
  read: z.boolean(),
});

const NotificationsResponseSchema = z.object({
  unreadCount: z.number(),
  data: z.array(NotificationSchema),
});

export type NotificationItem = z.infer<typeof NotificationSchema>;
export type NotificationsResponse = z.infer<typeof NotificationsResponseSchema>;

async function parseJson(res: Response) {
  const json = await res.json().catch(() => null);
  return json;
}

export async function fetchNotifications(): Promise<NotificationsResponse> {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  const json = await parseJson(res);
  const parsed = NotificationsResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));
  return parsed.data;
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications/${id}/read`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark read");
  return res.json().catch(() => ({}));
}

export async function markAllNotificationsRead() {
  const res = await fetch(`/api/notifications/mark-all-read`, { method: "POST" });
  if (!res.ok) throw new Error("Failed to mark all read");
  return res.json().catch(() => ({}));
}