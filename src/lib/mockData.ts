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

const pad2 = (n: number) => String(n).padStart(2, "0");

const makeDob = (seed: number) => {
  const year = 1950 + (seed % 55);
  const month = 1 + (seed % 12);
  const day = 1 + (seed % 28);
  return `${year}-${pad2(month)}-${pad2(day)}`;
};

const makeMrn = (seed: number) => `MRN-${String(100000 + seed).slice(-6)}`;

export const providers = Array.from({ length: 5 }).map((_, i) => ({
  id: `prov-${i + 1}`,
  name: `Provider ${i + 1}`,
}));

const riskLevels: RiskLevel[] = ["low", "medium", "high", "critical"];
const statuses: PatientStatus[] = ["active", "inactive", "deceased"];

export const patients: Patient[] = Array.from({ length: 50 }).map((_, i) => {
  const seed = i + 1;
  const providerId = providers[seed % providers.length].id;

  return {
    id: `pat-${seed}`,
    firstName: seed % 3 === 0 ? "Wei" : seed % 3 === 1 ? "Chi" : "Alex",
    lastName: `Patient${seed}`,
    dob: makeDob(seed),
    mrn: makeMrn(seed),
    status: statuses[seed % statuses.length],
    providerId,
    hasUpcoming: seed % 4 !== 0,
    riskLevel: riskLevels[seed % riskLevels.length],
  };
});