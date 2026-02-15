"use client";

import { useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { fetchPatients, type PatientsQuery } from "@/lib/api";

const parseBool = (v: string | null) => (v === "true" ? true : v === "false" ? false : undefined);

export default function PatientsPage() {
  const router = useRouter();
  const sp = useSearchParams();

  const query: PatientsQuery = useMemo(() => {
    const page = Number(sp.get("page") || "1");
    const limit = Number(sp.get("limit") || "10");

    return {
      search: sp.get("search") || undefined,
      status: (sp.get("status") as PatientsQuery["status"]) || undefined,
      provider: sp.get("provider") || undefined,
      hasUpcoming: parseBool(sp.get("hasUpcoming")),
      riskLevel: (sp.get("riskLevel") as PatientsQuery["riskLevel"]) || undefined,
      page: Number.isFinite(page) && page > 0 ? page : 1,
      limit: Number.isFinite(limit) && limit > 0 ? limit : 10,
      sortBy: sp.get("sortBy") || "name",
      sortOrder: (sp.get("sortOrder") as PatientsQuery["sortOrder"]) || "asc",
    };
  }, [sp]);

  const [searchDraft, setSearchDraft] = useState(query.search || "");

  const { data: resp, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["patients", query],
    queryFn: () => fetchPatients(query),
    placeholderData: (prev) => prev,
  });

  const rows = resp?.data ?? [];
  const pagination = resp?.pagination;

  const showLoading = isLoading && !resp;
  const showError = isError;
  const showEmpty = !showLoading && !showError && rows.length === 0;
  const showTable = !showLoading && !showError && rows.length > 0;

  const pushParams = (patch: Record<string, string | undefined>, resetPage = true) => {
    const next = new URLSearchParams(sp.toString());
    Object.entries(patch).forEach(([k, v]) => {
      if (!v) next.delete(k);
      else next.set(k, v);
    });
    if (resetPage) next.set("page", "1");
    router.push(`/patients?${next.toString()}`);
  };

  const goPage = (p: number) => {
    const next = new URLSearchParams(sp.toString());
    next.set("page", String(p));
    router.push(`/patients?${next.toString()}`);
  };

  return (
    <div className="mx-auto max-w-6xl p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Patients</h1>
          <div className="mt-1 text-sm text-gray-600">
            {isFetching ? "Updating…" : "Ready"}
          </div>
        </div>

        <button className="rounded-md border px-3 py-2 text-sm" onClick={() => refetch()}>
          Refresh
        </button>
      </div>

      <div className="mb-4 flex flex-col gap-3 rounded-lg border p-4">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <input
            className="w-full rounded-md border px-3 py-2"
            placeholder="Search name, MRN, or DOB"
            value={searchDraft}
            onChange={(e) => setSearchDraft(e.target.value)}
          />
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => pushParams({ search: searchDraft || undefined })}
          >
            Search
          </button>
          <button
            className="rounded-md border px-3 py-2 text-sm"
            onClick={() => {
              setSearchDraft("");
              router.push("/patients");
            }}
          >
            Clear
          </button>
        </div>

        <div className="flex flex-wrap gap-2">
          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={query.status || ""}
            onChange={(e) => pushParams({ status: e.target.value || undefined })}
          >
            <option value="">All status</option>
            <option value="active">active</option>
            <option value="inactive">inactive</option>
            <option value="deceased">deceased</option>
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={query.riskLevel || ""}
            onChange={(e) => pushParams({ riskLevel: e.target.value || undefined })}
          >
            <option value="">All risk</option>
            <option value="low">low</option>
            <option value="medium">medium</option>
            <option value="high">high</option>
            <option value="critical">critical</option>
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={query.hasUpcoming === undefined ? "" : String(query.hasUpcoming)}
            onChange={(e) => pushParams({ hasUpcoming: e.target.value || undefined })}
          >
            <option value="">Upcoming: any</option>
            <option value="true">Upcoming: yes</option>
            <option value="false">Upcoming: no</option>
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={query.sortBy || "name"}
            onChange={(e) => pushParams({ sortBy: e.target.value || undefined })}
          >
            <option value="name">sort: name</option>
            <option value="dob">sort: dob</option>
            <option value="mrn">sort: mrn</option>
            <option value="status">sort: status</option>
            <option value="riskLevel">sort: risk</option>
            <option value="hasUpcoming">sort: upcoming</option>
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={query.sortOrder || "asc"}
            onChange={(e) => pushParams({ sortOrder: e.target.value || undefined })}
          >
            <option value="asc">asc</option>
            <option value="desc">desc</option>
          </select>

          <select
            className="rounded-md border px-3 py-2 text-sm"
            value={String(query.limit || 10)}
            onChange={(e) => pushParams({ limit: e.target.value || undefined })}
          >
            <option value="5">5 / page</option>
            <option value="10">10 / page</option>
            <option value="20">20 / page</option>
            <option value="50">50 / page</option>
          </select>
        </div>
      </div>

      {showLoading && (
        <div className="rounded-lg border p-4">
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="mt-4 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100" />
            ))}
          </div>
        </div>
      )}

      {showError && (
        <div className="rounded-lg border p-4">
          <div className="text-sm font-medium">Failed to load patients</div>
          <div className="mt-1 text-sm text-gray-600">{(error as Error).message}</div>
          <button className="mt-3 rounded-md border px-3 py-2 text-sm" onClick={() => refetch()}>
            Retry
          </button>
        </div>
      )}

      {showEmpty && (
        <div className="rounded-lg border p-6 text-center">
          <div className="text-sm font-medium">No patients found</div>
          <div className="mt-1 text-sm text-gray-600">
            Try adjusting filters or clearing search.
          </div>
          <button className="mt-4 rounded-md border px-3 py-2 text-sm" onClick={() => router.push("/patients")}>
            Clear filters
          </button>
        </div>
      )}

      {showTable && pagination && (
        <div className="rounded-lg border">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b bg-gray-50">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">MRN</th>
                  <th className="px-4 py-3">DOB</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Risk</th>
                  <th className="px-4 py-3">Upcoming</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b last:border-b-0">
                    <td className="px-4 py-3">{p.firstName} {p.lastName}</td>
                    <td className="px-4 py-3">{p.mrn}</td>
                    <td className="px-4 py-3">{p.dob}</td>
                    <td className="px-4 py-3">{p.status}</td>
                    <td className="px-4 py-3">{p.riskLevel}</td>
                    <td className="px-4 py-3">{p.hasUpcoming ? "yes" : "no"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between gap-3 p-4">
            <div className="text-sm text-gray-600">
              Page {pagination.page} of {pagination.totalPages} · Total {pagination.total}
            </div>
            <div className="flex items-center gap-2">
              <button
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                disabled={pagination.page <= 1}
                onClick={() => goPage(pagination.page - 1)}
              >
                Prev
              </button>
              <button
                className="rounded-md border px-3 py-2 text-sm disabled:opacity-50"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => goPage(pagination.page + 1)}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}