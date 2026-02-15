import { NextRequest, NextResponse } from "next/server";
import { patients, Patient, PatientStatus, RiskLevel } from "@/lib/mockData";
import { z } from "zod";

const QuerySchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "deceased"]).optional(),
  provider: z.string().optional(),
  hasUpcoming: z
    .string()
    .transform((v) => (v === "true" ? true : v === "false" ? false : undefined))
    .optional(),
  riskLevel: z.enum(["low", "medium", "high", "critical"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).default("asc"),
});

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const includes = (a: string, b: string) => a.toLowerCase().includes(b.toLowerCase());

const sortValue = (p: Patient, key: string) => {
  if (key === "name") return `${p.lastName} ${p.firstName}`.toLowerCase();
  if (key === "dob") return p.dob;
  if (key === "mrn") return p.mrn;
  if (key === "status") return p.status;
  if (key === "provider") return p.providerId;
  if (key === "riskLevel") return p.riskLevel;
  if (key === "hasUpcoming") return p.hasUpcoming ? 1 : 0;
  return "";
};

export async function GET(req: NextRequest) {
  const latency = 200 + Math.floor(Math.random() * 301);
  await sleep(latency);

  if (Math.random() < 0.05) {
    return NextResponse.json({ message: "Simulated server error" }, { status: 500 });
  }

  const url = new URL(req.url);
  const raw = Object.fromEntries(url.searchParams.entries());
  const parsed = QuerySchema.safeParse(raw);

  if (!parsed.success) {
    return NextResponse.json(
      { message: "Invalid query params", issues: parsed.error.issues },
      { status: 400 }
    );
  }

  const {
    search,
    status,
    provider,
    hasUpcoming,
    riskLevel,
    page,
    limit,
    sortBy,
    sortOrder,
  } = parsed.data;

  let filtered = patients.slice();

  if (search && search.trim()) {
    const s = search.trim();
    filtered = filtered.filter(
      (p) =>
        includes(`${p.firstName} ${p.lastName}`, s) ||
        includes(p.mrn, s) ||
        includes(p.dob, s)
    );
  }

  if (status) filtered = filtered.filter((p) => p.status === (status as PatientStatus));
  if (provider) filtered = filtered.filter((p) => p.providerId === provider);
  if (hasUpcoming !== undefined) filtered = filtered.filter((p) => p.hasUpcoming === hasUpcoming);
  if (riskLevel) filtered = filtered.filter((p) => p.riskLevel === (riskLevel as RiskLevel));

  if (sortBy) {
    filtered.sort((a, b) => {
      const av = sortValue(a, sortBy);
      const bv = sortValue(b, sortBy);
      const cmp = String(av).localeCompare(String(bv));
      return sortOrder === "desc" ? -cmp : cmp;
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;
  const end = start + limit;

  return NextResponse.json({
    data: filtered.slice(start, end),
    pagination: { page: safePage, limit, total, totalPages },
  });
}