import { z } from "zod";

export const NotificationTypeSchema = z.enum(["appointment_update", "patient_alert", "message"]);

export const NotificationItemSchema = z.object({
  id: z.string().min(1),
  ts: z.string().min(1),
  type: NotificationTypeSchema,
  title: z.string().min(1),
  body: z.string().min(1),
  read: z.boolean(),
});

export const NotificationsResponseSchema = z.object({
  unreadCount: z.number().int().nonnegative(),
  data: z.array(NotificationItemSchema),
});

export type NotificationItem = z.infer<typeof NotificationItemSchema>;

const LS_KEY = "carehub.notifications.readIds";

function loadReadIds() {
  if (typeof window === "undefined") return new Set<string>();
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return new Set<string>();
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return new Set<string>();
    return new Set(arr.filter((x) => typeof x === "string"));
  } catch {
    return new Set<string>();
  }
}

function saveReadIds(set: Set<string>) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(LS_KEY, JSON.stringify(Array.from(set)));
}

function applyLocalRead(items: NotificationItem[]) {
  const readIds = loadReadIds();
  if (readIds.size === 0) return items;
  return items.map((n) => (readIds.has(n.id) ? { ...n, read: true } : n));
}

export async function fetchNotifications() {
  const res = await fetch("/api/notifications", { cache: "no-store" });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || "Failed to load notifications");
  }
  const json = await res.json();
  const parsed = NotificationsResponseSchema.safeParse(json);
  if (!parsed.success) throw new Error(JSON.stringify(parsed.error.issues));
  const patched = applyLocalRead(parsed.data.data);
  const unreadCount = patched.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
  return { unreadCount, data: patched };
}

export async function markNotificationRead(id: string) {
  const res = await fetch(`/api/notifications/${encodeURIComponent(id)}/read`, { method: "PUT" });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || "Failed to mark read");
  }
  const readIds = loadReadIds();
  readIds.add(id);
  saveReadIds(readIds);
  return true;
}

export async function markAllNotificationsRead() {
  const res = await fetch("/api/notifications/mark-all-read", { method: "POST" });
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || "Failed to mark all read");
  }
  const json = await res.json().catch(() => null);
  const readIds = loadReadIds();
  if (json?.data && Array.isArray(json.data)) {
    json.data.forEach((n: any) => {
      if (n?.id && typeof n.id === "string") readIds.add(n.id);
    });
    saveReadIds(readIds);
  } else {
    saveReadIds(new Set<string>(["__ALL__"]));
  }
  return true;
}

export function persistReadIds(ids: string[]) {
  const s = loadReadIds();
  ids.forEach((id) => s.add(id));
  saveReadIds(s);
}