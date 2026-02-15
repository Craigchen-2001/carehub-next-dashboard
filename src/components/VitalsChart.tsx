"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

type Vital = {
  ts: string;
  heartRate: number;
  systolic: number;
  diastolic: number;
  oxygenSat: number;
  temperatureC: number;
};

const shortTime = (s: string) => {
  const d = new Date(s);
  return `${d.getMonth() + 1}/${d.getDate()}`;
};

export default function VitalsChart({ vitals }: { vitals: Vital[] }) {
  const data = vitals
    .slice()
    .sort((a, b) => new Date(a.ts).getTime() - new Date(b.ts).getTime())
    .map((v) => ({
      t: shortTime(v.ts),
      hr: v.heartRate,
      sys: v.systolic,
      dia: v.diastolic,
      spo2: v.oxygenSat,
      temp: Number(v.temperatureC.toFixed(1)),
    }));

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm font-medium">Heart Rate</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid />
              <XAxis dataKey="t" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="hr" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border p-4">
        <div className="mb-2 text-sm font-medium">Blood Pressure</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid />
              <XAxis dataKey="t" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="sys" dot={false} />
              <Line type="monotone" dataKey="dia" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="rounded-lg border p-4 sm:col-span-2">
        <div className="mb-2 text-sm font-medium">SpO2</div>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid />
              <XAxis dataKey="t" />
              <YAxis domain={[90, 100]} />
              <Tooltip />
              <Line type="monotone" dataKey="spo2" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}