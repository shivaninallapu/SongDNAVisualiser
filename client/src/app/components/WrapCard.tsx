"use client";
import { useRef } from "react";

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

const STYLE_COLORS: Record<string, { from: string; to: string; text: string }> = {
  "Intensity Seeker":    { from: "#ef4444", to: "#f97316", text: "#fef2f2" },
  "Emotional Diver":     { from: "#8b5cf6", to: "#ec4899", text: "#fdf4ff" },
  "Chill Architect":     { from: "#3b82f6", to: "#06b6d4", text: "#eff6ff" },
  "Rhythm Chaser":       { from: "#eab308", to: "#f97316", text: "#fefce8" },
  "Mood Curator":        { from: "#6366f1", to: "#8b5cf6", text: "#eef2ff" },
  "Adventurous Explorer":{ from: "#10b981", to: "#14b8a6", text: "#ecfdf5" },
};

export default function WrapCard({ data, shareUrl }: { data: WrapData; shareUrl: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const colors = STYLE_COLORS[data.listening_style] || { from: "#8b5cf6", to: "#ec4899", text: "#fdf4ff" };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    alert("Link copied!");
  };

  return (
    <div className="max-w-lg mx-auto">
      {/* shareable card */}
      <div
        ref={cardRef}
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
              style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`, color: "white" }}
            >
              DNA Wrap
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{data.display_name}</h2>
            <p
              className="text-lg font-semibold"
              style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})`, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}
            >
              {data.personality_type}
            </p>
            <p className="text-white/50 text-sm mt-1">"{data.listening_style}"</p>
          </div>

          {/* stats row */}
          <div className="grid grid-cols-3 gap-3 mb-8">
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{data.dna_score}%</div>
              <div className="text-white/40 text-xs mt-1">Consistency</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{data.dominant_trait.value}%</div>
              <div className="text-white/40 text-xs mt-1 capitalize">{data.dominant_trait.name}</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4 text-center">
              <div className="text-2xl font-bold text-white">{data.tracks_analyzed}</div>
              <div className="text-white/40 text-xs mt-1">Tracks</div>
            </div>
          </div>

          {/* top tracks */}
          <div className="mb-8">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Top Tracks</h3>
            <div className="space-y-2">
              {data.top_tracks.map((t, i) => (
                <div key={t.id} className="flex items-center gap-3">
                  <div className="text-white/30 text-xs w-4">{i + 1}</div>
                  {t.image && (
                    <img src={t.image} alt={t.name} className="w-8 h-8 rounded-md flex-shrink-0" />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="text-white text-sm font-medium truncate">{t.name}</div>
                    <div className="text-white/40 text-xs truncate">{t.artist}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* DNA bars */}
          <div className="mb-8">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Your DNA Profile</h3>
            <div className="space-y-2">
              {Object.entries(data.avg_dna).map(([key, val]) => (
                <div key={key} className="flex items-center gap-3">
                  <div className="text-white/40 text-xs w-24 text-right capitalize">{key}</div>
                  <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${val * 100}%`,
                        background: `linear-gradient(90deg, ${colors.from}, ${colors.to})`,
                      }}
                    />
                  </div>
                  <div className="text-white/30 text-xs w-8">{Math.round(val * 100)}%</div>
                </div>
              ))}
            </div>
          </div>

          {/* footer */}
          <div className="text-center">
            <div className="text-white/20 text-xs">Song DNA — songdna.vercel.app</div>
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
            window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`);
          }}
          className="flex-1 py-3 rounded-full text-white text-sm font-medium transition-colors"
          style={{ background: `linear-gradient(135deg, ${colors.from}, ${colors.to})` }}
        >
          Share on X
        </button>
      </div>
    </div>
  );
}