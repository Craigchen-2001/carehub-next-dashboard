export type Provider = {
  id: string;
  name: string;
  rooms: string[];
};

export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";
export type AppointmentType = "in-person" | "telehealth";

export type Appointment = {
  id: string;
  patientId: string;
  patientName: string;
  providerId: string;
  room: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
};

export type ProviderSlot = {
  startTime: string;
  endTime: string;
  room: string;
};

export type ProviderSchedule = {
  providerId: string;
  slots: ProviderSlot[];
};

let providers: Provider[] = [
  { id: "prov-1", name: "Provider 1", rooms: ["Room A", "Room B"] },
  { id: "prov-2", name: "Provider 2", rooms: ["Room A"] },
  { id: "prov-3", name: "Provider 3", rooms: ["Room B", "Room C"] },
  { id: "prov-4", name: "Provider 4", rooms: ["Room C"] },
  { id: "prov-5", name: "Provider 5", rooms: ["Room A", "Room C"] },
];

function pad2(n: number) {
  return String(n).padStart(2, "0");
}

function toIsoLocal(d: Date) {
  return d.toISOString();
}

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

function addMinutes(d: Date, minutes: number) {
  const x = new Date(d);
  x.setMinutes(x.getMinutes() + minutes);
  return x;
}

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)];
}

function id(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makePatient(i: number) {
  const names = ["Alex", "Wei", "Chi", "Craig", "Sam", "Taylor", "Jordan", "Avery", "Casey", "Riley"];
  const last = `Patient${i}`;
  return { id: `pat-${i}`, name: `${pick(names)} ${last}` };
}

const patients = Array.from({ length: 60 }).map((_, i) => makePatient(i + 1));

let appointments: Appointment[] = [];

let schedules: ProviderSchedule[] = [];

function buildSchedules() {
  const base = startOfDay(new Date());
  schedules = providers.map((p) => {
    const slots: ProviderSlot[] = [];
    for (let day = 0; day < 14; day++) {
      const d = addDays(base, day);
      const start = new Date(d);
      start.setHours(9, 0, 0, 0);
      const end = new Date(d);
      end.setHours(17, 0, 0, 0);
      const blocks = [
        { s: 9, e: 12 },
        { s: 13, e: 17 },
      ];
      for (const b of blocks) {
        const s = new Date(d);
        s.setHours(b.s, 0, 0, 0);
        const e = new Date(d);
        e.setHours(b.e, 0, 0, 0);
        slots.push({ startTime: toIsoLocal(s), endTime: toIsoLocal(e), room: pick(p.rooms) });
      }
      void start;
      void end;
    }
    return { providerId: p.id, slots };
  });
}

function buildAppointments() {
  const base = startOfDay(new Date());
  const types: AppointmentType[] = ["in-person", "telehealth"];
  const statuses: AppointmentStatus[] = ["scheduled", "completed", "cancelled", "no-show"];
  const appts: Appointment[] = [];

  for (let i = 0; i < 120; i++) {
    const p = pick(providers);
    const pat = pick(patients);
    const dayOffset = randInt(0, 13);
    const day = addDays(base, dayOffset);
    const hour = pick([9, 10, 11, 13, 14, 15, 16]);
    const minute = pick([0, 15, 30, 45]);
    const start = new Date(day);
    start.setHours(hour, minute, 0, 0);
    const duration = pick([15, 30, 45, 60]);
    const end = addMinutes(start, duration);
    const type = pick(types);
    const status = pick(statuses);
    const room = pick(p.rooms);

    appts.push({
      id: id("apt"),
      patientId: pat.id,
      patientName: pat.name,
      providerId: p.id,
      room,
      startTime: toIsoLocal(start),
      endTime: toIsoLocal(end),
      type,
      status,
    });
  }

  appointments = appts;
}

buildSchedules();
buildAppointments();

export function listProviders() {
  return providers;
}

export function getProvider(id: string) {
  return providers.find((p) => p.id === id) || null;
}

export function getProviderSchedule(providerId: string) {
  return schedules.find((s) => s.providerId === providerId) || null;
}

export function listAppointments(params: { start: string; end: string; providerId?: string; room?: string }) {
  const start = new Date(params.start).getTime();
  const end = new Date(params.end).getTime();

  return appointments
    .filter((a) => {
      const s = new Date(a.startTime).getTime();
      const e = new Date(a.endTime).getTime();
      if (e <= start || s >= end) return false;
      if (params.providerId && a.providerId !== params.providerId) return false;
      if (params.room && a.room !== params.room) return false;
      return true;
    })
    .sort((a, b) => (a.startTime < b.startTime ? -1 : 1));
}

export function updateAppointment(id: string, patch: Partial<Pick<Appointment, "startTime" | "endTime" | "room" | "providerId" | "status">>) {
  const idx = appointments.findIndex((a) => a.id === id);
  if (idx < 0) return null;
  appointments[idx] = { ...appointments[idx], ...patch };
  return appointments[idx];
}

export function maybeDelay(minMs: number, maxMs: number) {
  const ms = randInt(minMs, maxMs);
  return new Promise((r) => setTimeout(r, ms));
}

export function maybeFail(pct: number) {
  return Math.random() < pct / 100;
}