"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Patient = {
  id: string;
  firstName: string;
  lastName: string;
  dob: string;
  mrn: string;
  status: "active" | "inactive" | "deceased";
  providerId: string;
  hasUpcoming: boolean;
  riskLevel: "low" | "medium" | "high" | "critical";
};

type PatientsResponse = {
  data: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
};

const buildQuery = (sp: URLSearchParams) => {
  const q = new URLSearchParams();

  const search = sp.get("search") || "";
  const status = sp.get("status") || "";
  const riskLevel = sp.get("riskLevel") || "";
  const provider = sp.get("provider") || "";
  const hasUpcoming = sp.get("hasUpcoming") || "";
  const page = sp.get("page") || "1";
  const limit = sp.get("limit") || "10";
  const sortBy = sp.get("sortBy") || "name";
  const sortOrder = sp.get("sortOrder") || "asc";

  if (search) q.set("search", search);
  if (status) q.set("status", status);
  if (riskLevel) q.set("riskLevel", riskLevel);
  if (provider) q.set("provider", provider);
  if (hasUpcoming) q.set("hasUpcoming", hasUpcoming);

  q.set("page", page);
  q.set("limit", limit);
  q.set("sortBy", sortBy);
  q.set("sortOrder", sortOrder);

  return q.toString();
};

const fetchPatients = async (qs: string): Promise<PatientsResponse> => {
  const res = await fetch(`/api/patients?${qs}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json();
};

const SkeletonRow = () => {
  return (
    <tr className="border-b last:border-b-0">
      <td className="px-3 py-2">
        <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-3 py-2">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-3 py-2">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-3 py-2">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-3 py-2">
        <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      </td>
      <td className="px-3 py-2">
        <div className="h-4 w-14 animate-pulse rounded bg-gray-200" />
      </td>
    </tr>
  );
};

export default function PatientsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const qc = useQueryClient();

  const qs = useMemo(() => buildQuery(new URLSearchParams(sp.toString())), [sp]);

  const q = useQuery({
    queryKey: ["patients", qs],
    queryFn: () => fetchPatients(qs),
    staleTime: 0,
    refetchOnWindowFocus: false,
  });

  const current = useMemo(() => new URLSearchParams(sp.toString()), [sp]);

  const setParam = (key: string, value: string) => {
    const next = new URLSearchParams(current.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.set("page", "1");
    router.push(`/patients?${next.toString()}`);
  };

  const setMany = (pairs: Array<[string, string]>) => {
    const next = new URLSearchParams(current.toString());
    for (const [k, v] of pairs) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    next.set("page", "1");
    router.push(`/patients?${next.toString()}`);
  };

  const page = Number(current.get("page") || "1");
  const limit = current.get("limit") || "10";
  const sortBy = current.get("sortBy") || "name";
  const sortOrder = current.get("sortOrder") || "asc";

  const [searchDraft, setSearchDraft] = useState(current.get("search") || "");
  const [refreshNonce, setRefreshNonce] = useState(0);

  const isLoadingUI = q.isLoading || q.isFetching;

  const doRefresh = async () => {
    setRefreshNonce((v) => v + 1);
    await qc.invalidateQueries({ queryKey: ["patients"] });
    await q.refetch({ cancelRefetch: false });
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <div className="mt-1 text-sm text-gray-600">
            {isLoadingUI ? "Loading" : q.isError ? "Error" : "Ready"}
          </div>
        </div>
        <button className="rounded-md border px-3 py-2 text-sm" onClick={doRefresh}>
          Refresh
        </button>
      </div>

      <div className="mb-4 rounded-lg border p-4">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-2 sm:flex-row">
            <input
              className="w-full rounded-md border px-3 py-2 text-sm"
              placeholder="Search name, MRN, DOB"
              value={searchDraft}
              onChange={(e) => setSearchDraft(e.target.value)}
            />
            <div className="flex gap-2">
              <button
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => setParam("search", searchDraft.trim())}
              >
                Search
              </button>
              <button
                className="rounded-md border px-3 py-2 text-sm"
                onClick={() => {
                  setSearchDraft("");
                  setMany([
                    ["search", ""],
                    ["status", ""],
                    ["riskLevel", ""],
                    ["hasUpcoming", ""],
                    ["provider", ""],
                    ["sortBy", "name"],
                    ["sortOrder", "asc"],
                    ["limit", "10"],
                  ]);
                }}
              >
                Clear
              </button>
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap">
            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={current.get("status") || ""}
              onChange={(e) => setParam("status", e.target.value)}
            >
              <option value="">All status</option>
              <option value="active">active</option>
              <option value="inactive">inactive</option>
              <option value="deceased">deceased</option>
            </select>

            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={current.get("riskLevel") || ""}
              onChange={(e) => setParam("riskLevel", e.target.value)}
            >
              <option value="">All risk</option>
              <option value="low">low</option>
              <option value="medium">medium</option>
              <option value="high">high</option>
              <option value="critical">critical</option>
            </select>

            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={current.get("hasUpcoming") || ""}
              onChange={(e) => setParam("hasUpcoming", e.target.value)}
            >
              <option value="">Upcoming: any</option>
              <option value="true">Upcoming: yes</option>
              <option value="false">Upcoming: no</option>
            </select>

            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={sortBy}
              onChange={(e) => setParam("sortBy", e.target.value)}
            >
              <option value="name">sort: name</option>
              <option value="mrn">sort: mrn</option>
              <option value="dob">sort: dob</option>
              <option value="status">sort: status</option>
              <option value="riskLevel">sort: risk</option>
              <option value="hasUpcoming">sort: upcoming</option>
            </select>

            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={sortOrder}
              onChange={(e) => setParam("sortOrder", e.target.value)}
            >
              <option value="asc">asc</option>
              <option value="desc">desc</option>
            </select>

            <select
              className="rounded-md border px-3 py-2 text-sm"
              value={limit}
              onChange={(e) => setParam("limit", e.target.value)}
            >
              <option value="5">5 / page</option>
              <option value="10">10 / page</option>
              <option value="20">20 / page</option>
            </select>
          </div>
        </div>
      </div>

      <div className="rounded-lg border" key={refreshNonce}>
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="px-3 py-2">Name</th>
                <th className="px-3 py-2">MRN</th>
                <th className="px-3 py-2">DOB</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Risk</th>
                <th className="px-3 py-2">Upcoming</th>
              </tr>
            </thead>
            <tbody>
              {isLoadingUI && (
                <>
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                  <SkeletonRow />
                </>
              )}

              {!isLoadingUI && q.isError && (
                <tr>
                  <td className="px-3 py-8 text-center text-sm text-gray-600" colSpan={6}>
                    {(q.error as Error).message}
                  </td>
                </tr>
              )}

              {!isLoadingUI && !q.isError && q.data && q.data.data.length === 0 && (
                <tr>
                  <td className="px-3 py-8 text-center text-sm text-gray-600" colSpan={6}>
                    No patients found
                  </td>
                </tr>
              )}

              {!isLoadingUI &&
                !q.isError &&
                q.data &&
                q.data.data.map((p) => (
                  <tr
                    key={p.id}
                    className="cursor-pointer border-b hover:bg-gray-50 last:border-b-0"
                    onClick={() => router.push(`/patients/${p.id}?tab=overview`)}
                  >
                    <td className="px-3 py-2">{p.firstName} {p.lastName}</td>
                    <td className="px-3 py-2">{p.mrn}</td>
                    <td className="px-3 py-2">{p.dob}</td>
                    <td className="px-3 py-2">{p.status}</td>
                    <td className="px-3 py-2">{p.riskLevel}</td>
                    <td className="px-3 py-2">{p.hasUpcoming ? "yes" : "no"}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex items-center justify-between p-4 text-sm">
          <div className="text-gray-600">
            Page {q.data?.pagination.page || page} of {q.data?.pagination.totalPages || 1} · Total {q.data?.pagination.total || 0}
          </div>
          <div className="flex gap-2">
            <button
              className="rounded-md border px-3 py-2 disabled:opacity-50"
              disabled={isLoadingUI || (q.data?.pagination.page || page) <= 1}
              onClick={() => setParam("page", String((q.data?.pagination.page || page) - 1))}
            >
              Prev
            </button>
            <button
              className="rounded-md border px-3 py-2 disabled:opacity-50"
              disabled={isLoadingUI || (q.data?.pagination.page || page) >= (q.data?.pagination.totalPages || 1)}
              onClick={() => setParam("page", String((q.data?.pagination.page || page) + 1))}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}