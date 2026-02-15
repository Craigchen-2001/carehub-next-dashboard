export type PatientStatus = "active" | "inactive" | "deceased";
export type RiskLevel = "low" | "medium" | "high" | "critical";

export type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  mrn: string;
  status: PatientStatus;
  providerId: string;
  hasUpcoming: boolean;
  riskLevel: RiskLevel;
};

export type PatientsResponse = {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

export type PatientsQuery = {
  search?: string;
  status?: PatientStatus;
  provider?: string;
  hasUpcoming?: boolean;
  riskLevel?: RiskLevel;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
};

export const buildPatientsQueryString = (q: PatientsQuery) => {
  const params = new URLSearchParams();

  if (q.search) params.set("search", q.search);
  if (q.status) params.set("status", q.status);
  if (q.provider) params.set("provider", q.provider);
  if (q.hasUpcoming !== undefined) params.set("hasUpcoming", String(q.hasUpcoming));
  if (q.riskLevel) params.set("riskLevel", q.riskLevel);
  if (q.page) params.set("page", String(q.page));
  if (q.limit) params.set("limit", String(q.limit));
  if (q.sortBy) params.set("sortBy", q.sortBy);
  if (q.sortOrder) params.set("sortOrder", q.sortOrder);

  const s = params.toString();
  return s ? `?${s}` : "";
};

export const fetchPatients = async (q: PatientsQuery): Promise<PatientsResponse> => {
  const res = await fetch(`/api/patients${buildPatientsQueryString(q)}`);
  if (!res.ok) {
    const payload = await res.json().catch(() => null);
    const message = payload?.message || `Request failed (${res.status})`;
    throw new Error(message);
  }
  return res.json();
};