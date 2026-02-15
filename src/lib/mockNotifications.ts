export type NotificationType = "appointment_update" | "patient_alert" | "message";

export type NotificationItem = {
  id: string;
  ts: string;
  type: NotificationType;
  title: string;
  body: string;
  read: boolean;
};

type Store = {
  items: NotificationItem[];
};

const g = globalThis as unknown as { __CAREHUB_NOTIFS__?: Store };

function getStore(): Store {
  if (!g.__CAREHUB_NOTIFS__) g.__CAREHUB_NOTIFS__ = { items: [] };
  return g.__CAREHUB_NOTIFS__;
}

export function listNotifications() {
  const s = getStore();
  return s.items.slice().sort((a, b) => (a.ts < b.ts ? 1 : -1));
}

export function unreadCount() {
  const s = getStore();
  return s.items.reduce((acc, n) => acc + (n.read ? 0 : 1), 0);
}

export function addNotification(input: { type: NotificationType; title: string; body: string }) {
  const s = getStore();
  const item: NotificationItem = {
    id: `ntf-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    ts: new Date().toISOString(),
    type: input.type,
    title: input.title,
    body: input.body,
    read: false,
  };
  s.items = [item, ...s.items].slice(0, 50);
  return item;
}

export function markRead(id: string) {
  const s = getStore();
  let changed = false;
  s.items = s.items.map((n) => {
    if (n.id !== id) return n;
    if (n.read) return n;
    changed = true;
    return { ...n, read: true };
  });
  return changed;
}

export function markAllRead() {
  const before = unreadCount();
  const s = getStore();
  s.items = s.items.map((n) => ({ ...n, read: true }));
  const after = unreadCount();
  return { before, after };
}

export function resetNotifications() {
  const s = getStore();
  s.items = [];
}