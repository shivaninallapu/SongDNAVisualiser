"use client";
import { useEffect, useState } from "react";

interface WrapData {
  wrap_id: string;
  display_name: string;
  personality_type: string;
  listening_style: string;
  avg_dna: Record<string, number>;
  top_tracks: Array<{
    id: string;
    name: string;
    artist: string;
    image: string;
    dna: Record<string, number>;
  }>;
  dominant_trait: { name: string; value: number };
  rarest_trait: { name: string; value: number };
  dna_score: number;
  tracks_analyzed: number;
}

const STYLE_COLORS: Record<string, { from: string; to: string }> = {
  "Intensity Seeker":     { from: "#ef4444", to: "#f97316" },
  "Emotional Diver":      { from: "#8b5cf6", to: "#ec4899" },
  "Chill Architect":      { from: "#3b82f6", to: "#06b6d4" },
  "Rhythm Chaser":        { from: "#eab308", to: "#f97316" },
  "Mood Curator":         { from: "#6366f1", to: "#8b5cf6" },
  "Adventurous Explorer": { from: "#10b981", to: "#14b8a6" },
};

function getMoodLabel(valence: number): string {
  if (valence > 0.7) return "Euphoric";
  if (valence > 0.5) return "Upbeat";
  if (valence > 0.35) return "Neutral";
  if (valence > 0.2) return "Melancholic";
  return "Dark";
}

function getEnergyLabel(energy: number): string {
  if (energy > 0.8) return "Explosive";
  if (energy > 0.6) return "High Energy";
  if (energy > 0.4) return "Moderate";
  if (energy > 0.2) return "Calm";
  return "Ambient";
}

function getTasteLabel(score: number): string {
  if (score > 80) return "Very Consistent";
  if (score > 60) return "Focused";
  if (score > 40) return "Varied";
  return "Eclectic";
}

function AnimatedBar({
  value,
  from,
  to,
  delay = 0,
}: {
  value: number;
  from: string;
  to: string;
  delay?: number;
}) {
  const [width, setWidth] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      setWidth(value * 100);
    }, delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return (
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{
          width: `${width}%`,
          background: `linear-gradient(90deg, ${from}, ${to})`,
          transition: "width 1s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      />
    </div>
  );
}

function AnimatedNumber({ target, delay = 0 }: { target: number; delay?: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => {
      let start = 0;
      const step = target / 30;
      const interval = setInterval(() => {
        start += step;
        if (start >= target) {
          setCurrent(target);
          clearInterval(interval);
        } else {
          setCurrent(Math.floor(start));
        }
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(timer);
  }, [target, delay]);

  return <>{current}</>;
}

export default function WrapCard({
  data,
  shareUrl,
}: {
  data: WrapData;
  shareUrl: string;
}) {
  const [visible, setVisible] = useState(false);
  const colors =
    STYLE_COLORS[data.listening_style] || { from: "#8b5cf6", to: "#ec4899" };

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const moodLabel = getMoodLabel(data.avg_dna.valence || 0.5);
  const energyLabel = getEnergyLabel(data.avg_dna.energy || 0.5);
  const tasteLabel = getTasteLabel(data.dna_score);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied!");
  };

  return (
    <div
      className="max-w-lg mx-auto"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
      }}
    >
      <div
        className="rounded-3xl overflow-hidden"
        style={{
          background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          padding: "2px",
        }}
      >
        <div className="bg-gray-950 rounded-3xl p-8">

          {/* header */}
          <div className="text-center mb-8">
            <div
              className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-3"
              style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                color: "white",
              }}
            >
              DNA Wrap
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">
              {data.display_name}
            </h2>
            <p
              className="text-lg font-semibold"
              style={{
                background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}
            >
              {data.personality_type}
            </p>
            <p className="text-white/50 text-sm mt-1">
              {data.listening_style}
            </p>
          </div>

          {/* animated stats row */}
          <div className="grid grid-cols-3 gap-3 mb-6">
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                <AnimatedNumber target={data.dna_score} delay={300} />%
              </div>
              <div className="text-white/40 text-xs mt-1">Consistency</div>
              <div className="text-white/30 text-xs mt-0.5">{tasteLabel}</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                <AnimatedNumber target={data.dominant_trait.value} delay={400} />%
              </div>
              <div className="text-white/40 text-xs mt-1 capitalize">
                {data.dominant_trait.name}
              </div>
              <div className="text-white/30 text-xs mt-0.5">Top trait</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">
                <AnimatedNumber target={data.tracks_analyzed} delay={500} />
              </div>
              <div className="text-white/40 text-xs mt-1">Tracks</div>
              <div className="text-white/30 text-xs mt-0.5">Analyzed</div>
            </div>
          </div>

          {/* mood + energy insight row */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="text-white/40 text-xs mb-2 uppercase tracking-wider">Mood</div>
              <div
                className="text-lg font-bold"
                style={{
                  background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {moodLabel}
              </div>
              <div className="text-white/30 text-xs mt-1">
                {Math.round((data.avg_dna.valence || 0) * 100)}% valence
              </div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="text-white/40 text-xs mb-2 uppercase tracking-wider">Energy</div>
              <div
                className="text-lg font-bold"
                style={{
                  background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }}
              >
                {energyLabel}
              </div>
              <div className="text-white/30 text-xs mt-1">
                {Math.round((data.avg_dna.energy || 0) * 100)}% energy
              </div>
            </div>
          </div>

          {/* rarest trait insight */}
          <div className="bg-white/5 rounded-2xl p-4 mb-6">
            <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Your Rarest Trait</div>
            <div className="flex items-center justify-between">
              <div>
                <span
                  className="font-semibold capitalize"
                  style={{
                    background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                  }}
                >
                  {data.rarest_trait.name}
                </span>
                <span className="text-white/40 text-xs ml-2">
                  — only {data.rarest_trait.value}% of your DNA
                </span>
              </div>
            </div>
          </div>

          {/* top tracks */}
          <div className="mb-6">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">
              Top Tracks
            </h3>
            <div className="space-y-2">
              {data.top_tracks.map((t, i) => (
                <div
                  key={t.id}
                  className="flex items-center gap-3"
                  style={{
                    opacity: visible ? 1 : 0,
                    transform: visible ? "translateX(0)" : "translateX(-10px)",
                    transition: `opacity 0.4s ease ${i * 0.1 + 0.5}s, transform 0.4s ease ${i * 0.1 + 0.5}s`,
                  }}
                >
                  <div className="text-white/30 text-xs w-4">{i + 1}</div>
                  {t.image && (
                    <img
                      src={t.image}
                      alt={t.name}
                      className="w-8 h-8 rounded-md flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">
                      {t.name}
                    </div>
                    <div className="text-white/40 text-xs truncate">{t.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* animated DNA bars */}
          <div className="mb-8">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">
              DNA Profile
            </h3>
            <div className="space-y-2">
              {Object.entries(data.avg_dna).map(([key, val], i) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="text-white/40 text-xs w-24 text-right capitalize">
                    {key}
                  </div>
                  <AnimatedBar
                    value={val}
                    from={colors.from}
                    to={colors.to}
                    delay={i * 80 + 200}
                  />
                  <div className="text-white/30 text-xs w-8">
                    {Math.round(val * 100)}%
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* footer */}
          <div className="text-center">
            <div className="text-white/20 text-xs">
              Song DNA — song-dna-visualiser.vercel.app
            </div>
          </div>
        </div>
      </div>

      {/* share buttons */}
      <div className="flex gap-3 mt-6">
        <button
          onClick={handleCopyLink}
          className="flex-1 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
        >
          Copy Link
        </button>
        <button
          onClick={() => {
            const text = `My music DNA Wrap — I'm "${data.personality_type}" on Song DNA. Check yours:`;
            window.open(
              `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`
            );
          }}
          className="flex-1 py-3 rounded-full text-white text-sm font-medium transition-colors"
          style={{
            background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`,
          }}
        >
          Share on X
        </button>
      </div>
    </div>
  );
}