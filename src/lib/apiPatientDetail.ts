import { z } from "zod";

export const PatientSchema = z.object({
  id: z.string(),
  firstName: z.string(),
  lastName: z.string(),
  dob: z.string(),
  mrn: z.string(),
  status: z.enum(["active", "inactive", "deceased"]),
  providerId: z.string(),
  hasUpcoming: z.boolean(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]),
});

export type Patient = z.infer<typeof PatientSchema>;

export const AppointmentSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  providerId: z.string(),
  status: z.enum(["scheduled", "completed", "cancelled", "no-show"]),
  type: z.enum(["in-person", "telehealth"]),
});

export type Appointment = z.infer<typeof AppointmentSchema>;

export const VitalSchema = z.object({
  patientId: z.string(),
  ts: z.string(),
  heartRate: z.number(),
  systolic: z.number(),
  diastolic: z.number(),
  temperatureC: z.number(),
  oxygenSat: z.number(),
});

export type Vital = z.infer<typeof VitalSchema>;

export const NoteSchema = z.object({
  id: z.string(),
  patientId: z.string(),
  ts: z.string(),
  author: z.string(),
  text: z.string(),
});

export type Note = z.infer<typeof NoteSchema>;

const withLatency = async (min = 200, max = 500) => {
  const ms = Math.floor(Math.random() * (max - min + 1)) + min;
  await new Promise((r) => setTimeout(r, ms));
};

const maybeFail = (rate = 0.05) => {
  if (Math.random() < rate) throw new Error("Simulated network error");
};

const jsonFetch = async <T>(url: string, schema: z.ZodType<T>, failRate = 0.05) => {
  await withLatency();
  maybeFail(failRate);

  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = await res.json();
  return schema.parse(json);
};

export const fetchPatient = (id: string) =>
  jsonFetch(`/api/patients/${id}`, PatientSchema, 0.05);

export const fetchAppointments = (id: string) =>
  jsonFetch(`/api/patients/${id}/appointments`, z.array(AppointmentSchema), 0.05);

export const fetchVitals = (id: string) =>
  jsonFetch(`/api/patients/${id}/vitals`, z.array(VitalSchema), 0.05);

export const fetchNotes = (id: string) =>
  jsonFetch(`/api/patients/${id}/notes`, z.array(NoteSchema), 0.05);

export const postNote = async (id: string, author: string, text: string) => {
  await withLatency();
  maybeFail(0.05);

  const res = await fetch(`/api/patients/${id}/notes`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ author, text }),
  });

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = await res.json();
  return NoteSchema.parse(json);
};

export const postAppointment = async (
  id: string,
  payload: {
    startTime: string;
    endTime: string;
    providerId: string;
    status: "scheduled" | "completed" | "cancelled" | "no-show";
    type: "in-person" | "telehealth";
  }
) => {
  await withLatency();
  maybeFail(0.05);

  const res = await fetch(`/api/patients/${id}/appointments`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  const json = await res.json();
  return AppointmentSchema.parse(json);
};