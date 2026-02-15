"use client";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html>
      <body>
        <div className="mx-auto max-w-2xl p-6">
          <div className="rounded-lg border p-4">
            <div className="text-lg font-semibold">Global error</div>
            <div className="mt-2 text-sm text-gray-700">{error.message}</div>
            <div className="mt-4 flex gap-2">
              <button className="rounded-md border px-3 py-2 text-sm" onClick={() => reset()}>
                Retry
              </button>
              <button className="rounded-md border px-3 py-2 text-sm" onClick={() => location.reload()}>
                Reload
              </button>
            </div>
          </div>
        </div>
      </body>
    </html>
  );
}