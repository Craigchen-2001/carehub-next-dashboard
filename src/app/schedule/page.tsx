"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import AppointmentSidePanel, { type Appointment as PanelAppointment, type CreateAppointmentPayload } from "@/components/AppointmentSidePanel";
import { createAppointment, updateAppointment } from "@/lib/apiSchedule";

type Provider = {
  id: string;
  name: string;
  rooms: string[];
};

type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  room: string;
  startTime: string;
  endTime: string;
  type: "in-person" | "telehealth";
  status: "scheduled" | "completed" | "cancelled" | "no-show";
};

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function addDays(d: Date, days: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + days);
  return x;
}

function formatDayLabel(d: Date) {
  return d.toLocaleDateString(undefined, { weekday: "short", month: "2-digit", day: "2-digit" });
}

function formatTimeRange(a: Appointment) {
  const s = new Date(a.startTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  const e = new Date(a.endTime).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  return `${s} - ${e}`;
}

async function fetchProviders() {
  const res = await fetch("/api/providers");
  if (!res.ok) throw new Error("Failed to load providers");
  return (await res.json()) as Provider[];
}

async function fetchAppointments(params: { start: string; end: string; provider?: string; room?: string }) {
  const sp = new URLSearchParams();
  sp.set("start", params.start);
  sp.set("end", params.end);
  if (params.provider) sp.set("provider", params.provider);
  if (params.room) sp.set("room", params.room);

  const res = await fetch(`/api/appointments?${sp.toString()}`);
  if (!res.ok) {
    const j = await res.json().catch(() => null);
    const msg = j?.message || "Failed to load appointments";
    throw new Error(msg);
  }
  const j = (await res.json()) as { data: Appointment[] };
  return j.data;
}

export default function SchedulePage() {
  const [view, setView] = useState<"week" | "day">("week");
  const [anchor, setAnchor] = useState<Date>(() => startOfDay(new Date()));
  const [providerId, setProviderId] = useState<string>("");
  const [room, setRoom] = useState<string>("");

  const [panelOpen, setPanelOpen] = useState(false);
  const [selected, setSelected] = useState<PanelAppointment | null>(null);

  const [draftCreate, setDraftCreate] = useState<{ startIso: string; endIso: string } | null>(null);

  const range = useMemo(() => {
    const start = startOfDay(anchor);
    const days = view === "week" ? 7 : 1;
    const end = addDays(start, days);
    return { start, end };
  }, [anchor, view]);

  const apptKey = useMemo(
    () => ["appointments", range.start.toISOString(), range.end.toISOString(), providerId, room] as const,
    [range.start, range.end, providerId, room]
  );

  const providersQ = useQuery({
    queryKey: ["providers"],
    queryFn: fetchProviders,
  });

  const rooms = useMemo(() => {
    if (!providersQ.data) return [];
    if (!providerId) {
      const set = new Set<string>();
      providersQ.data.forEach((p) => p.rooms.forEach((r) => set.add(r)));
      return Array.from(set).sort();
    }
    const p = providersQ.data.find((x) => x.id === providerId);
    return (p?.rooms || []).slice().sort();
  }, [providersQ.data, providerId]);

  const apptsQ = useQuery({
    queryKey: apptKey,
    queryFn: () =>
      fetchAppointments({
        start: range.start.toISOString(),
        end: range.end.toISOString(),
        provider: providerId || undefined,
        room: room || undefined,
      }),
    retry: 2,
  });

  const days = useMemo(() => {
    const start = range.start;
    const n = view === "week" ? 7 : 1;
    return Array.from({ length: n }).map((_, i) => addDays(start, i));
  }, [range.start, view]);

  const byDay = useMemo(() => {
    const map = new Map<string, Appointment[]>();
    (apptsQ.data || []).forEach((a) => {
      const d = startOfDay(new Date(a.startTime)).toISOString();
      const prev = map.get(d) || [];
      map.set(d, [...prev, a]);
    });
    return map;
  }, [apptsQ.data]);

  const conflictIds = useMemo(() => {
    const appts = (apptsQ.data || []).slice();
    appts.sort((a, b) => (a.startTime < b.startTime ? -1 : 1));

    const set = new Set<string>();
    const byProvider = new Map<string, Appointment[]>();

    for (const a of appts) {
      const prev = byProvider.get(a.providerId) || [];
      byProvider.set(a.providerId, [...prev, a]);
    }

    for (const [, list] of byProvider) {
      const sorted = list.slice().sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
      for (let i = 0; i < sorted.length; i++) {
        const cur = sorted[i];
        const curS = new Date(cur.startTime).getTime();
        const curE = new Date(cur.endTime).getTime();
        for (let j = i + 1; j < sorted.length; j++) {
          const nxt = sorted[j];
          const nxtS = new Date(nxt.startTime).getTime();
          const nxtE = new Date(nxt.endTime).getTime();
          if (nxtS >= curE) break;
          const overlap = curS < nxtE && nxtS < curE;
          if (overlap) {
            set.add(cur.id);
            set.add(nxt.id);
          }
        }
      }
    }

    return set;
  }, [apptsQ.data]);

  const isToday = (d: Date) => startOfDay(d).getTime() === startOfDay(new Date()).getTime();

  const qc = useQueryClient();

  const rescheduleMut = useMutation({
    mutationFn: (input: { id: string; startTime: string; endTime: string }) =>
      updateAppointment(input.id, { startTime: input.startTime, endTime: input.endTime }),
    onMutate: async (input) => {
      await qc.cancelQueries({ queryKey: apptKey });

      const prev = qc.getQueryData<Appointment[]>(apptKey) || [];
      const next = prev.map((a) => (a.id === input.id ? { ...a, startTime: input.startTime, endTime: input.endTime } : a));
      qc.setQueryData<Appointment[]>(apptKey, next);

      setSelected((p) => (p && p.id === input.id ? { ...p, startTime: input.startTime, endTime: input.endTime } : p));

      return { prev };
    },
    onError: (_err, _input, ctx) => {
      if (ctx?.prev) qc.setQueryData(apptKey, ctx.prev);
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  const createMut = useMutation({
    mutationFn: (payload: CreateAppointmentPayload) => createAppointment(payload),
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ["appointments"] });
    },
  });

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Schedule</h1>
          <div className="mt-1 text-sm text-gray-600">
            {range.start.toLocaleDateString()} - {addDays(range.end, -1).toLocaleDateString()}
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className={`rounded-md border px-3 py-2 text-sm ${view === "week" ? "font-semibold" : ""}`} onClick={() => setView("week")}>
            Week
          </button>
          <button className={`rounded-md border px-3 py-2 text-sm ${view === "day" ? "font-semibold" : ""}`} onClick={() => setView("day")}>
            Day
          </button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setAnchor(addDays(anchor, -7))}>
            Prev
          </button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setAnchor(addDays(anchor, 7))}>
            Next
          </button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => setAnchor(startOfDay(new Date()))}>
            Today
          </button>
        </div>
      </div>

      <div className="mb-4 rounded-lg border p-4">
        <div className="grid gap-3 sm:grid-cols-3">
          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-600">Provider</div>
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={providerId}
              onChange={(e) => {
                setProviderId(e.target.value);
                setRoom("");
              }}
            >
              <option value="">All providers</option>
              {(providersQ.data || []).map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.id})
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-600">Room</div>
            <select className="rounded-md border px-3 py-2 text-sm" value={room} onChange={(e) => setRoom(e.target.value)}>
              <option value="">All rooms</option>
              {rooms.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <div className="text-xs text-gray-600">Actions</div>
            <div className="flex gap-2">
              <button className="rounded-md border px-3 py-2 text-sm disabled:opacity-50" disabled={apptsQ.isFetching} onClick={() => apptsQ.refetch()}>
                Refresh
              </button>
              <button
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => {
                  const start = new Date();
                  const end = new Date(start.getTime() + 30 * 60 * 1000);
                  setDraftCreate({ startIso: start.toISOString(), endIso: end.toISOString() });
                  setSelected(null);
                  setPanelOpen(true);
                }}
              >
                Create
              </button>
            </div>
          </div>
        </div>

        {apptsQ.isError && (
          <div className="mt-3 flex items-center justify-between gap-3 rounded-md border p-3 text-sm">
            <div className="text-gray-700">{(apptsQ.error as Error).message}</div>
            <button className="rounded-md border px-3 py-2 text-sm" onClick={() => apptsQ.refetch()}>
              Retry
            </button>
          </div>
        )}

        {apptsQ.isLoading && <div className="mt-3 text-sm text-gray-600">Loading…</div>}
      </div>

      <div className={`grid gap-3 ${view === "week" ? "sm:grid-cols-7" : "sm:grid-cols-1"}`}>
        {days.map((d) => {
          const key = startOfDay(d).toISOString();
          const items = byDay.get(key) || [];
          return (
            <div key={key} className={`rounded-lg border ${isToday(d) ? "border-black" : ""}`}>
              <div className="border-b px-3 py-2 text-sm font-medium">
                {formatDayLabel(d)} {isToday(d) ? "• Today" : ""}
              </div>
              <div className="p-3">
                {apptsQ.isFetching && items.length === 0 && <div className="text-sm text-gray-600">Loading…</div>}
                {!apptsQ.isFetching && items.length === 0 && <div className="text-sm text-gray-600">No appointments</div>}
                <div className="space-y-2">
                  {items.map((a) => (
                    <div
                      key={a.id}
                      className={`cursor-pointer rounded-md border p-2 text-sm ${conflictIds.has(a.id) ? "border-red-500" : ""}`}
                      onClick={() => {
                        setDraftCreate(null);
                        setSelected(a as unknown as PanelAppointment);
                        setPanelOpen(true);
                      }}
                    >
                      <div className="font-medium">{a.patientName}</div>
                      <div className="text-gray-600">{formatTimeRange(a)}</div>
                      <div className="text-gray-600">
                        {a.type} · {a.status}
                      </div>
                      <div className="text-gray-600">
                        {a.providerId} · {a.room}
                      </div>
                      {conflictIds.has(a.id) && <div className="mt-1 text-xs text-red-600">Conflict</div>}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <AppointmentSidePanel
        open={panelOpen}
        appointment={selected}
        onClose={() => {
          setPanelOpen(false);
          setDraftCreate(null);
        }}
        onReschedule={({ id, startTime, endTime }) => {
          rescheduleMut.mutate({ id, startTime, endTime });
        }}
        busy={rescheduleMut.isPending || createMut.isPending}
        createMode={!!draftCreate}
        defaultStartTime={draftCreate?.startIso || null}
        defaultEndTime={draftCreate?.endIso || null}
        onCreate={(payload) => {
          createMut.mutate(payload);
          setPanelOpen(false);
          setDraftCreate(null);
        }}
      />
    </div>
  );
}