"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchAppointments,
  fetchNotes,
  fetchPatient,
  fetchVitals,
  postNote,
  type Note,
} from "@/lib/apiPatientDetail";
import { SectionBoundary } from "@/components/SectionBoundary";

type TabKey = "overview" | "appointments" | "vitals" | "notes";

const TABS: TabKey[] = ["overview", "appointments", "vitals", "notes"];

const formatDate = (s: string) => {
  const d = new Date(s);
  return d.toLocaleString();
};

export default function PatientDetailPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const params = useParams<{ id: string }>();
  const id = params.id;

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
      qc.invalidateQueries({ queryKey: ["notes", id] });
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
                    <div>BP: {vitalsQ.data[vitalsQ.data.length - 1].systolic}/{vitalsQ.data[vitalsQ.data.length - 1].diastolic}</div>
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
            {apptQ.isLoading && <div className="text-sm text-gray-600">Loading…</div>}
            {apptQ.isError && <div className="text-sm text-gray-600">{(apptQ.error as Error).message}</div>}
            {apptQ.data && (
              <div className="space-y-2">
                {apptQ.data.map((a) => (
                  <div key={a.id} className="rounded-md border p-3 text-sm">
                    <div className="font-medium">{a.type} · {a.status}</div>
                    <div className="text-gray-600">{formatDate(a.startTime)} - {formatDate(a.endTime)}</div>
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
            {vitalsQ.data && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="border-b bg-gray-50">
                    <tr>
                      <th className="px-3 py-2">Time</th>
                      <th className="px-3 py-2">HR</th>
                      <th className="px-3 py-2">BP</th>
                      <th className="px-3 py-2">Temp C</th>
                      <th className="px-3 py-2">SpO2</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vitalsQ.data.slice(-10).reverse().map((v) => (
                      <tr key={v.ts} className="border-b last:border-b-0">
                        <td className="px-3 py-2">{formatDate(v.ts)}</td>
                        <td className="px-3 py-2">{v.heartRate}</td>
                        <td className="px-3 py-2">{v.systolic}/{v.diastolic}</td>
                        <td className="px-3 py-2">{v.temperatureC.toFixed(1)}</td>
                        <td className="px-3 py-2">{v.oxygenSat}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
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