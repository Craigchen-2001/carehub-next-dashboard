import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto max-w-3xl p-10">
      <h1 className="text-3xl font-semibold">CareHub</h1>
      <p className="mt-2 text-gray-600">Provider dashboard demo</p>
      <div className="mt-6">
        <Link className="rounded-md border px-4 py-2 text-sm" href="/patients">
          Go to Patients
        </Link>
      </div>
    </main>
  );
}