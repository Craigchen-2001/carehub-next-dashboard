"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchNotifications, markAllNotificationsRead, markNotificationRead } from "@/lib/apiNotifications";

export default function NotificationBell() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const q = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
    refetchInterval: 5000,
  });

  const unread = q.data?.unreadCount ?? 0;
  const items = q.data?.data ?? [];

  const markAllMut = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const markOneMut = useMutation({
    mutationFn: (id: string) => markNotificationRead(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["notifications"] }),
  });

  const latest = useMemo(() => items.slice(0, 10), [items]);

  return (
    <div className="relative">
      <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setOpen((v) => !v)}>
        Notifications{unread > 0 ? ` (${unread})` : ""}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-[520px] rounded-lg border bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold">Recent notifications</div>
            <button
              className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
              disabled={markAllMut.isPending || unread === 0}
              onClick={() => markAllMut.mutate()}
            >
              Mark all read
            </button>
          </div>

          <div className="mt-3 space-y-2">
            {q.isLoading && <div className="text-sm text-gray-600">Loading…</div>}
            {q.isError && <div className="text-sm text-gray-600">{(q.error as Error).message}</div>}

            {!q.isLoading && !q.isError && latest.length === 0 && (
              <div className="text-sm text-gray-600">No notifications</div>
            )}

            {latest.map((n) => (
              <button
                key={n.id}
                className={`w-full rounded-md border p-3 text-left text-sm ${
                  n.read ? "opacity-70" : "font-medium"
                }`}
                onClick={() => markOneMut.mutate(n.id)}
              >
                <div className="flex items-center justify-between gap-3">
                  <div>{n.title}</div>
                  <div className="text-xs text-gray-600">{new Date(n.ts).toLocaleString()}</div>
                </div>
                <div className="mt-1 text-sm text-gray-700">{n.body}</div>
              </button>
            ))}
          </div>

          <div className="mt-3 flex justify-end">
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setOpen(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}