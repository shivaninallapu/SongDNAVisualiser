"use client";
import { useEffect, useRef } from "react";
import * as d3 from "d3";

interface Props {
  dna: Record<string, number>;
}

const FEATURE_COLORS: Record<string, string> = {
  energy:           "#f472b6",
  valence:          "#a78bfa",
  danceability:     "#34d399",
  acousticness:     "#60a5fa",
  instrumentalness: "#fbbf24",
  liveness:         "#f87171",
  speechiness:      "#818cf8",
  tempo:            "#2dd4bf",
  loudness:         "#fb923c",
};

export default function DnaHelix({ dna }: Props) {
  const ref = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (!ref.current || !dna) return;
    const svg = d3.select(ref.current);
    svg.selectAll("*").remove();

    const W = 320, H = 500;
    const cx = W / 2;
    const features = Object.keys(dna);
    const n = features.length;
    const step = H / (n + 1);
    const amplitude = 80;
    const freq = Math.PI / (n + 1);

    features.forEach((key, i) => {
      const y = step * (i + 1);
      const val = dna[key];
      const x1 = cx + Math.sin(freq * (i + 1)) * amplitude;
      const x2 = cx - Math.sin(freq * (i + 1)) * amplitude;
      const color = FEATURE_COLORS[key] || "#fff";
      const thickness = 2 + val * 8;

      // rung
      svg.append("line")
        .attr("x1", x1).attr("y1", y)
        .attr("x2", x2).attr("y2", y)
        .attr("stroke", color)
        .attr("stroke-width", thickness)
        .attr("stroke-linecap", "round")
        .attr("opacity", 0.2 + val * 0.8);

      // left dot
      svg.append("circle")
        .attr("cx", x1).attr("cy", y).attr("r", 5)
        .attr("fill", color);

      // right dot
      svg.append("circle")
        .attr("cx", x2).attr("cy", y).attr("r", 5)
        .attr("fill", color);

      // label
      svg.append("text")
        .attr("x", cx + amplitude + 16)
        .attr("y", y + 4)
        .attr("fill", color)
        .attr("font-size", "11px")
        .attr("font-family", "monospace")
        .text(`${key} ${Math.round(val * 100)}%`);
    });

    // backbone curves
    const leftPoints = features.map((_, i) => ({
      x: cx + Math.sin(freq * (i + 1)) * amplitude,
      y: step * (i + 1),
    }));
    const rightPoints = features.map((_, i) => ({
      x: cx - Math.sin(freq * (i + 1)) * amplitude,
      y: step * (i + 1),
    }));

    const line = d3.line<{x: number; y: number}>()
      .x(d => d.x).y(d => d.y).curve(d3.curveCatmullRom);

    svg.append("path")
      .datum(leftPoints)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", 2);

    svg.append("path")
      .datum(rightPoints)
      .attr("d", line)
      .attr("fill", "none")
      .attr("stroke", "rgba(255,255,255,0.2)")
      .attr("stroke-width", 2);

  }, [dna]);

  return <svg ref={ref} width={320} height={500} />;
}