"use client";

import { useMemo, useState } from "react";
import { useToast } from "@/components/ToastProvider";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAppointments,
  fetchNotes,
  fetchPatient,
  fetchVitals,
  postAppointment,
  postNote,
  type Appointment,
  type Note,
} from "@/lib/apiPatientDetail";
import { SectionBoundary } from "@/components/SectionBoundary";
import VitalsChart from "@/components/VitalsChart";

type TabKey = "overview" | "appointments" | "vitals" | "notes";

const TABS: TabKey[] = ["overview", "appointments", "vitals", "notes"];

const formatDate = (s: string) => {
  const d = new Date(s);
  return d.toLocaleString();
};

const toLocalInputValue = (iso: string) => {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const mi = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
};

const localInputToIso = (local: string) => {
  const d = new Date(local);
  return d.toISOString();
};

export default function PatientDetailPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const params = useParams<{ id: string }>();
  const id = params.id;

  const toast = useToast();

  const tab = (sp.get("tab") as TabKey) || "overview";
  const activeTab: TabKey = TABS.includes(tab) ? tab : "overview";

  const setTab = (t: TabKey) => {
    const next = new URLSearchParams(sp.toString());
    next.set("tab", t);
    router.push(`/patients/${id}?${next.toString()}`);
  };

  const qc = useQueryClient();

  const patientQ = useQuery({
    queryKey: ["patient", id],
    queryFn: () => fetchPatient(id),
  });

  const apptQ = useQuery({
    queryKey: ["appointments", id],
    queryFn: () => fetchAppointments(id),
  });

  const vitalsQ = useQuery({
    queryKey: ["vitals", id],
    queryFn: () => fetchVitals(id),
  });

  const notesQ = useQuery({
    queryKey: ["notes", id],
    queryFn: () => fetchNotes(id),
  });

  const [noteText, setNoteText] = useState("");

  const addNoteMut = useMutation({
    mutationFn: (payload: { author: string; text: string }) => postNote(id, payload.author, payload.text),
    onMutate: async ({ author, text }) => {
      await qc.cancelQueries({ queryKey: ["notes", id] });
      const prev = qc.getQueryData<Note[]>(["notes", id]) || [];
      const optimistic: Note = {
        id: `optimistic-${Date.now()}`,
        patientId: id,
        ts: new Date().toISOString(),
        author,
        text,
      };
      qc.setQueryData<Note[]>(["notes", id], [optimistic, ...prev]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["notes", id], ctx.prev);
    },
    onSuccess: () => {
      toast.push({ title: "Note added" });
      qc.invalidateQueries({ queryKey: ["notes", id] });
    },
  });

  const nowLocal = useMemo(() => toLocalInputValue(new Date().toISOString()), []);

  const [apptStartLocal, setApptStartLocal] = useState(nowLocal);
  const [apptMinutes, setApptMinutes] = useState("30");
  const [apptType, setApptType] = useState<"in-person" | "telehealth">("in-person");
  const [apptStatus, setApptStatus] = useState<"scheduled" | "completed" | "cancelled" | "no-show">("scheduled");

  const createApptMut = useMutation({
    mutationFn: async () => {
      const startIso = localInputToIso(apptStartLocal);
      const start = new Date(startIso);
      const end = new Date(start.getTime() + Number(apptMinutes) * 60 * 1000);

      const providerId = patientQ.data?.providerId || "provider-1";

      return postAppointment(id, {
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        providerId,
        status: apptStatus,
        type: apptType,
      });
    },
    onMutate: async () => {
      await qc.cancelQueries({ queryKey: ["appointments", id] });
      const prev = qc.getQueryData<Appointment[]>(["appointments", id]) || [];

      const startIso = localInputToIso(apptStartLocal);
      const start = new Date(startIso);
      const end = new Date(start.getTime() + Number(apptMinutes) * 60 * 1000);

      const optimistic: Appointment = {
        id: `optimistic-${Date.now()}`,
        patientId: id,
        startTime: start.toISOString(),
        endTime: end.toISOString(),
        providerId: patientQ.data?.providerId || "provider-1",
        status: apptStatus,
        type: apptType,
      };

      qc.setQueryData<Appointment[]>(["appointments", id], [optimistic, ...prev]);
      return { prev };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.prev) qc.setQueryData(["appointments", id], ctx.prev);
    },
    onSuccess: () => {
      toast.push({ title: "Appointment created" });
      qc.invalidateQueries({ queryKey: ["appointments", id] });
    },
  });

  const header = useMemo(() => {
    if (patientQ.isLoading) return { title: "Loading…", sub: "" };
    if (patientQ.isError || !patientQ.data) return { title: "Patient not available", sub: "" };
    const p = patientQ.data;
    return {
      title: `${p.firstName} ${p.lastName}`,
      sub: `MRN ${p.mrn} · DOB ${p.dob} · Status ${p.status} · Risk ${p.riskLevel}`,
    };
  }, [patientQ.isLoading, patientQ.isError, patientQ.data]);

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{header.title}</h1>
          <div className="mt-1 text-sm text-gray-600">{header.sub}</div>
        </div>

        <div className="flex flex-wrap gap-2">
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => router.push("/patients")}>
            Back
          </button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => patientQ.refetch()}>
            Refresh
          </button>
          <button className="rounded-md border px-3 py-2 text-sm" onClick={() => alert("Edit patient (mock)")}>
            Edit info
          </button>
        </div>
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {TABS.map((t) => (
          <button
            key={t}
            className={`rounded-md border px-3 py-2 text-sm ${activeTab === t ? "font-semibold" : ""}`}
            onClick={() => setTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "overview" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <SectionBoundary title="Overview">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium">Summary</div>
              <div className="mt-2 text-sm text-gray-700">
                {patientQ.data ? (
                  <div className="space-y-1">
                    <div>Provider: {patientQ.data.providerId}</div>
                    <div>Upcoming appointment: {patientQ.data.hasUpcoming ? "yes" : "no"}</div>
                  </div>
                ) : (
                  "No patient data"
                )}
              </div>
            </div>
          </SectionBoundary>

          <SectionBoundary title="Signals">
            <div className="rounded-lg border p-4">
              <div className="text-sm font-medium">Recent</div>
              <div className="mt-2 text-sm text-gray-700">
                {vitalsQ.data && vitalsQ.data.length > 0 ? (
                  <div className="space-y-1">
                    <div>HR: {vitalsQ.data[vitalsQ.data.length - 1].heartRate}</div>
                    <div>
                      BP: {vitalsQ.data[vitalsQ.data.length - 1].systolic}/{vitalsQ.data[vitalsQ.data.length - 1].diastolic}
                    </div>
                    <div>SpO2: {vitalsQ.data[vitalsQ.data.length - 1].oxygenSat}</div>
                  </div>
                ) : (
                  "No vitals"
                )}
              </div>
            </div>
          </SectionBoundary>
        </div>
      )}

      {activeTab === "appointments" && (
        <SectionBoundary title="Appointments">
          <div className="rounded-lg border p-4">
            <div className="mb-4 rounded-lg border p-4">
              <div className="text-sm font-medium">Create appointment</div>

              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">Start time</div>
                  <input
                    className="rounded-md border px-3 py-2 text-sm"
                    type="datetime-local"
                    value={apptStartLocal}
                    onChange={(e) => setApptStartLocal(e.target.value)}
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">Duration</div>
                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={apptMinutes}
                    onChange={(e) => setApptMinutes(e.target.value)}
                  >
                    <option value="15">15 min</option>
                    <option value="30">30 min</option>
                    <option value="45">45 min</option>
                    <option value="60">60 min</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">Type</div>
                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={apptType}
                    onChange={(e) => setApptType(e.target.value as "in-person" | "telehealth")}
                  >
                    <option value="in-person">in-person</option>
                    <option value="telehealth">telehealth</option>
                  </select>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="text-xs text-gray-600">Status</div>
                  <select
                    className="rounded-md border px-3 py-2 text-sm"
                    value={apptStatus}
                    onChange={(e) => setApptStatus(e.target.value as "scheduled" | "completed" | "cancelled" | "no-show")}
                  >
                    <option value="scheduled">scheduled</option>
                    <option value="completed">completed</option>
                    <option value="cancelled">cancelled</option>
                    <option value="no-show">no-show</option>
                  </select>
                </div>
              </div>

              <div className="mt-3 flex gap-2">
                <button
                  className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                  disabled={createApptMut.isPending || patientQ.isLoading}
                  onClick={() => createApptMut.mutate()}
                >
                  Create
                </button>
                <button className="rounded-md border px-3 py-2 text-sm" onClick={() => apptQ.refetch()}>
                  Refresh list
                </button>
              </div>

              {createApptMut.isError && (
                <div className="mt-2 text-sm text-gray-600">{(createApptMut.error as Error).message}</div>
              )}
            </div>

            {apptQ.isLoading && <div className="text-sm text-gray-600">Loading…</div>}
            {apptQ.isError && <div className="text-sm text-gray-600">{(apptQ.error as Error).message}</div>}

            {apptQ.data && (
              <div className="space-y-2">
                {apptQ.data.map((a) => (
                  <div key={a.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">
                      {a.type} · {a.status}
                    </div>
                    <div className="text-gray-600">
                      {formatDate(a.startTime)} - {formatDate(a.endTime)}
                    </div>
                    <div className="text-gray-600">Provider: {a.providerId}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionBoundary>
      )}

      {activeTab === "vitals" && (
        <SectionBoundary title="Vitals">
          <div className="rounded-lg border p-4">
            {vitalsQ.isLoading && <div className="text-sm text-gray-600">Loading…</div>}
            {vitalsQ.isError && <div className="text-sm text-gray-600">{(vitalsQ.error as Error).message}</div>}
            {vitalsQ.data && vitalsQ.data.length > 0 && <VitalsChart vitals={vitalsQ.data} />}
            {vitalsQ.data && vitalsQ.data.length === 0 && <div className="text-sm text-gray-600">No vitals</div>}
          </div>
        </SectionBoundary>
      )}

      {activeTab === "notes" && (
        <SectionBoundary title="Notes">
          <div className="rounded-lg border p-4">
            <div className="mb-3 flex flex-col gap-2">
              <textarea
                className="w-full rounded-md border p-2 text-sm"
                rows={3}
                placeholder="Write a note"
                value={noteText}
                onChange={(e) => setNoteText(e.target.value)}
              />
              <div className="flex gap-2">
                <button
                  className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                  disabled={!noteText.trim() || addNoteMut.isPending}
                  onClick={() => {
                    addNoteMut.mutate({ author: "Provider 1", text: noteText.trim() });
                    setNoteText("");
                  }}
                >
                  Add note
                </button>
                <button className="rounded-md border px-3 py-2 text-sm" onClick={() => notesQ.refetch()}>
                  Refresh
                </button>
              </div>
            </div>

            {notesQ.isLoading && <div className="text-sm text-gray-600">Loading…</div>}
            {notesQ.isError && <div className="text-sm text-gray-600">{(notesQ.error as Error).message}</div>}

            {notesQ.data && (
              <div className="space-y-2">
                {notesQ.data.map((n) => (
                  <div key={n.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{n.author}</div>
                    <div className="text-gray-600">{formatDate(n.ts)}</div>
                    <div className="mt-2">{n.text}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </SectionBoundary>
      )}
    </div>
  );
}