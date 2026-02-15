import { patients } from "@/lib/mockData";

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";

export type Appointment = {
  id: string;
  patientId: string;
  startTime: string;
  endTime: string;
  providerId: string;
  status: AppointmentStatus;
  type: "in-person" | "telehealth";
};

export type Vital = {
  patientId: string;
  ts: string;
  heartRate: number;
  systolic: number;
  diastolic: number;
  temperatureC: number;
  oxygenSat: number;
};

export type Note = {
  id: string;
  patientId: string;
  ts: string;
  author: string;
  text: string;
};

const iso = (d: Date) => d.toISOString();

const addDays = (d: Date, days: number) => new Date(d.getTime() + days * 24 * 60 * 60 * 1000);

export const getPatientById = (id: string) => patients.find((p) => p.id === id) || null;

export const appointmentsStore: Record<string, Appointment[]> = Object.fromEntries(
  patients.map((p, idx) => {
    const base = addDays(new Date(), -(idx % 10));
    const appts: Appointment[] = Array.from({ length: 3 }).map((_, j) => {
      const start = new Date(base.getTime() + j * 24 * 60 * 60 * 1000 + (9 + j) * 60 * 60 * 1000);
      const end = new Date(start.getTime() + 30 * 60 * 1000);
      const status: AppointmentStatus = j === 0 ? "completed" : j === 1 ? "scheduled" : "cancelled";
      const type = j % 2 === 0 ? "in-person" : "telehealth";
      return {
        id: `appt-${p.id}-${j + 1}`,
        patientId: p.id,
        startTime: iso(start),
        endTime: iso(end),
        providerId: p.providerId,
        status,
        type,
      };
    });
    return [p.id, appts];
  })
);

export const listAppointments = (patientId: string) => appointmentsStore[patientId] || [];

export const addAppointment = (patientId: string, appt: Omit<Appointment, "id" | "patientId">) => {
  const next: Appointment = {
    id: `appt-${patientId}-${Date.now()}`,
    patientId,
    ...appt,
  };
  appointmentsStore[patientId] = [next, ...(appointmentsStore[patientId] || [])];
  return next;
};

export const vitals: Vital[] = patients.flatMap((p, idx) => {
  const base = addDays(new Date(), -14);
  return Array.from({ length: 14 }).map((_, d) => {
    const ts = addDays(base, d);
    return {
      patientId: p.id,
      ts: iso(ts),
      heartRate: 60 + ((idx + d) % 30),
      systolic: 110 + ((idx + d) % 25),
      diastolic: 70 + ((idx + d) % 15),
      temperatureC: 36.2 + (((idx + d) % 10) * 0.1),
      oxygenSat: 94 + ((idx + d) % 6),
    };
  });
});

export const notesStore: Record<string, Note[]> = Object.fromEntries(
  patients.map((p, idx) => [
    p.id,
    [
      {
        id: `note-${p.id}-1`,
        patientId: p.id,
        ts: iso(addDays(new Date(), -2)),
        author: "Provider 1",
        text: `Follow-up plan reviewed. Patient ${idx + 1}.`,
      },
    ],
  ])
);

export const listNotes = (patientId: string) => notesStore[patientId] || [];

export const addNote = (patientId: string, author: string, text: string) => {
  const next: Note = {
    id: `note-${patientId}-${Date.now()}`,
    patientId,
    ts: iso(new Date()),
    author,
    text,
  };
  notesStore[patientId] = [next, ...(notesStore[patientId] || [])];
  return next;
};