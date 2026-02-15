export type NotificationType = "appointment_update" | "patient_alert" | "message";

export type NotificationItem = {
  id: string;
  ts: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
};

let store: NotificationItem[] = [];

export function listNotifications() {
  return store.slice().sort((a, b) => (a.ts < b.ts ? 1 : -1));
}

export function unreadCount() {
  return store.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
}

export function addNotification(input: { type: NotificationType; title: string; body: string }) {
  const item: NotificationItem = {
    id: `ntf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ts: new Date().toISOString(),
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
  };
  store = [item, ...store].slice(0, 50);
  return item;
}

export function markRead(id: string) {
  let changed = false;
  store = store.map((n) => {
    if (n.id !== id) return n;
    if (n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  return changed;
}

export function markAllRead() {
  const before = unreadCount();
  store = store.map((n) => ({ ...n, read: true }));
  const after = unreadCount();
  return { before, after };
}

export function resetNotifications() {
  store = [];
}