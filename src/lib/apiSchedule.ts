export type AppointmentType = "in-person" | "telehealth";
export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";

export type CreateAppointmentInput = {
  patientId: string;
  providerId: string;
  room: string;
  startTime: string;
  endTime: string;
  type: AppointmentType;
  status: AppointmentStatus;
};

export type UpdateAppointmentInput = Partial<Pick<CreateAppointmentInput, "startTime" | "endTime" | "status" | "type" | "room" | "providerId">>;

export async function createAppointment(input: CreateAppointmentInput) {
  const res = await fetch("/api/appointments", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || "Failed to create appointment");
  }

  return await res.json();
}

export async function updateAppointment(id: string, patch: UpdateAppointmentInput) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    throw new Error(j?.message || "Failed to update appointment");
  }

  return await res.json();
}