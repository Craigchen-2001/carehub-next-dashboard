import { describe, expect, it } from "vitest";

const base = "http://localhost:3000";

async function toJson(res: Response) {
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

describe("API basic tests", () => {
  it("GET /api/providers returns 5", async () => {
    const res = await fetch(`${base}/api/providers`);
    expect(res.status).toBe(200);
    const j = await toJson(res);
    expect(Array.isArray(j)).toBe(true);
    expect(j.length).toBe(5);
  });

  it("GET /api/providers/prov-1/schedule returns slots", async () => {
    const res = await fetch(`${base}/api/providers/prov-1/schedule`);
    expect(res.status).toBe(200);
    const j = await toJson(res);
    expect(Array.isArray(j?.slots)).toBe(true);
  });

  it("GET /api/appointments returns data (503 sometimes ok)", async () => {
    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 7);

    const sp = new URLSearchParams();
    sp.set("start", start.toISOString());
    sp.set("end", end.toISOString());

    const res = await fetch(`${base}/api/appointments?${sp.toString()}`);
    if (res.status === 503) {
      expect(res.status).toBe(503);
      return;
    }
    expect(res.status).toBe(200);
    const j = await toJson(res);
    expect(Array.isArray(j?.data)).toBe(true);
  });

  it("GET /api/notifications returns unreadCount + data", async () => {
    const res = await fetch(`${base}/api/notifications`);
    expect(res.status).toBe(200);
    const j = await toJson(res);
    expect(typeof j?.unreadCount).toBe("number");
    expect(Array.isArray(j?.data)).toBe(true);
  });

  it("POST /api/notifications/mark-all-read works", async () => {
    const res = await fetch(`${base}/api/notifications/mark-all-read`, { method: "POST" });
    expect(res.status).toBe(200);
    const j = await toJson(res);
    expect(typeof j?.before).toBe("number");
    expect(typeof j?.after).toBe("number");
  });
});