export type AppointmentStatus = "scheduled" | "completed" | "cancelled" | "no-show";

export async function updateAppointment(id: string, patch: { startTime: string; endTime: string }) {
  const res = await fetch(`/api/appointments/${id}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });

  if (!res.ok) {
    const j = await res.json().catch(() => null);
    const msg = j?.message || "Failed to update appointment";
    throw new Error(msg);
  }

  return res.json();
}