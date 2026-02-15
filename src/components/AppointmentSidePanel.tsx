"use client";

import { useEffect, useMemo, useState } from "react";

export type Appointment = {
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

export type CreateAppointmentPayload = {
  patientId: string;
  providerId: string;
  room: string;
  startTime: string;
  endTime: string;
  type: "in-person" | "telehealth";
  status: "scheduled" | "completed" | "cancelled" | "no-show";
};

function formatDT(iso: string) {
  return new Date(iso).toLocaleString();
}

function toLocalInputValue(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

function localInputToIso(local: string) {
  return new Date(local).toISOString();
}

export default function AppointmentSidePanel(props: {
  open: boolean;
  appointment: Appointment | null;
  onClose: () => void;
  onReschedule: (input: { id: string; startTime: string; endTime: string }) => void;
  busy?: boolean;

  createMode?: boolean;
  defaultStartTime?: string | null;
  defaultEndTime?: string | null;
  onCreate?: (payload: CreateAppointmentPayload) => void;
}) {
  const { open, appointment, onClose, onReschedule, busy, createMode, defaultStartTime, defaultEndTime, onCreate } = props;

  const initial = useMemo(() => {
    if (createMode) {
      const startIso = defaultStartTime || new Date().toISOString();
      const endIso =
        defaultEndTime ||
        new Date(new Date(startIso).getTime() + 30 * 60 * 1000).toISOString();

      return {
        startLocal: toLocalInputValue(startIso),
        minutes: String(
          Math.max(15, Math.round((new Date(endIso).getTime() - new Date(startIso).getTime()) / 60000))
        ),
      };
    }

    if (!appointment) return null;

    return {
      startLocal: toLocalInputValue(appointment.startTime),
      minutes: String(
        Math.max(15, Math.round((new Date(appointment.endTime).getTime() - new Date(appointment.startTime).getTime()) / 60000))
      ),
    };
  }, [appointment, createMode, defaultStartTime, defaultEndTime]);

  const [startLocal, setStartLocal] = useState("");
  const [minutes, setMinutes] = useState("30");
  const [type, setType] = useState<"in-person" | "telehealth">("in-person");
  const [status, setStatus] = useState<"scheduled" | "completed" | "cancelled" | "no-show">("scheduled");
  const [patientId, setPatientId] = useState("patient-1");
  const [providerId, setProviderId] = useState("prov-1");
  const [room, setRoom] = useState("Room A");

  useEffect(() => {
    if (!initial) return;
    setStartLocal(initial.startLocal);
    setMinutes(initial.minutes);
  }, [initial]);

  if (!open) return null;

  const a = appointment;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg">
        <div className="flex items-start justify-between border-b p-4">
          <div>
            <div className="text-lg font-semibold">{createMode ? "Create appointment" : "Appointment"}</div>
            <div className="mt-1 text-sm text-gray-600">{createMode ? "New" : a ? a.patientName : ""}</div>
          </div>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="p-4">
          {!createMode && a && (
            <div className="rounded-lg border p-3 text-sm">
              <div className="font-medium">{a.patientName}</div>
              <div className="mt-1 text-gray-600">
                {formatDT(a.startTime)} - {formatDT(a.endTime)}
              </div>
              <div className="mt-1 text-gray-600">
                {a.type} · {a.status}
              </div>
              <div className="mt-1 text-gray-600">
                {a.providerId} · {a.room}
              </div>
            </div>
          )}

          <div className="mt-4 rounded-lg border p-3">
            <div className="text-sm font-medium">{createMode ? "Details" : "Reschedule"}</div>

            {createMode && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">Patient ID</div>
                  <input className="rounded-md border px-3 py-2 text-sm" value={patientId} onChange={(e) => setPatientId(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">Provider ID</div>
                  <input className="rounded-md border px-3 py-2 text-sm" value={providerId} onChange={(e) => setProviderId(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">Room</div>
                  <input className="rounded-md border px-3 py-2 text-sm" value={room} onChange={(e) => setRoom(e.target.value)} />
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">Type</div>
                  <select className="rounded-md border px-3 py-2 text-sm" value={type} onChange={(e) => setType(e.target.value as any)}>
                    <option value="in-person">in-person</option>
                    <option value="telehealth">telehealth</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1 sm:col-span-2">
                  <div className="text-xs text-gray-600">Status</div>
                  <select className="rounded-md border px-3 py-2 text-sm" value={status} onChange={(e) => setStatus(e.target.value as any)}>
                    <option value="scheduled">scheduled</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="no-show">no-show</option>
                  </select>
                </div>
              </div>
            )}

            <div className="mt-3 flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-600">Start time</div>
                <input
                  className="rounded-md border px-3 py-2 text-sm"
                  type="datetime-local"
                  value={startLocal}
                  onChange={(e) => setStartLocal(e.target.value)}
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="text-xs text-gray-600">Duration</div>
                <select className="rounded-md border px-3 py-2 text-sm" value={minutes} onChange={(e) => setMinutes(e.target.value)}>
                  <option value="15">15 min</option>
                  <option value="30">30 min</option>
                  <option value="45">45 min</option>
                  <option value="60">60 min</option>
                </select>
              </div>

              <button
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                disabled={busy || !startLocal}
                onClick={() => {
                  const startIso = localInputToIso(startLocal);
                  const start = new Date(startIso);
                  const end = new Date(start.getTime() + Number(minutes) * 60 * 1000);

                  const ok = window.confirm(createMode ? "Create this appointment?" : "Reschedule this appointment?");
                  if (!ok) return;

                  if (createMode) {
                    onCreate?.({
                      patientId,
                      providerId,
                      room,
                      startTime: start.toISOString(),
                      endTime: end.toISOString(),
                      type,
                      status,
                    });
                    return;
                  }

                  if (!a) return;
                  onReschedule({ id: a.id, startTime: start.toISOString(), endTime: end.toISOString() });
                }}
              >
                Save
              </button>
            </div>
          </div>

          <div className="mt-3 text-xs text-gray-600">Times are shown in your local timezone.</div>
        </div>
      </div>
    </div>
  );
}