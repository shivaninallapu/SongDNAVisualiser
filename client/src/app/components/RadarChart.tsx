"use client";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer,
} from "recharts";

interface Props {
  dna: Record<string, number>;
}

export default function DnaRadar({ dna }: Props) {
  const data = Object.entries(dna).map(([key, val]) => ({
    feature: key.charAt(0).toUpperCase() + key.slice(1),
    value: Math.round(val * 100),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.15)" />
        <PolarAngleAxis dataKey="feature" tick={{ fill: "rgba(255,255,255,0.7)", fontSize: 12 }} />
        <Radar dataKey="value" stroke="#a78bfa" fill="#a78bfa" fillOpacity={0.3} />
      </RadarChart>
    </ResponsiveContainer>
  );
}