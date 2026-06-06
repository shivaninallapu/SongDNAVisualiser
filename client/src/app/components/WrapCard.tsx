"use client";
import { useEffect, useState, useRef } from "react";

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

function getMoodLabel(valence: number) {
  if (valence > 0.7) return "Euphoric";
  if (valence > 0.5) return "Upbeat";
  if (valence > 0.35) return "Neutral";
  if (valence > 0.2) return "Melancholic";
  return "Dark";
}

function getEnergyLabel(energy: number) {
  if (energy > 0.8) return "Explosive";
  if (energy > 0.6) return "High Energy";
  if (energy > 0.4) return "Moderate";
  if (energy > 0.2) return "Calm";
  return "Ambient";
}

function getTasteLabel(score: number) {
  if (score > 80) return "Very Consistent";
  if (score > 60) return "Focused";
  if (score > 40) return "Varied";
  return "Eclectic";
}

function AnimatedBar({ value, from, to, delay = 0 }: { value: number; from: string; to: string; delay?: number }) {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setWidth(value * 100), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return (
    <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full"
        style={{ width: `${width}%`, background: `linear-gradient(90deg, ${from}, ${to})`, transition: "width 1s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </div>
  );
}

function AnimatedNumber({ target, delay = 0 }: { target: number; delay?: number }) {
  const [current, setCurrent] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => {
      let start = 0;
      const step = target / 30;
      const interval = setInterval(() => {
        start += step;
        if (start >= target) { setCurrent(target); clearInterval(interval); }
        else setCurrent(Math.floor(start));
      }, 30);
      return () => clearInterval(interval);
    }, delay);
    return () => clearTimeout(t);
  }, [target, delay]);
  return <>{current}</>;
}

export default function WrapCard({ data, shareUrl }: { data: WrapData; shareUrl: string }) {
  const [slide, setSlide] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"left" | "right">("left");
  const [visible, setVisible] = useState(false);
  const touchStartX = useRef<number | null>(null);
  const colors = STYLE_COLORS[data.listening_style] || { from: "#8b5cf6", to: "#ec4899" };
  const totalSlides = 3;

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 100);
    return () => clearTimeout(t);
  }, []);

  const goTo = (next: number, dir: "left" | "right") => {
    if (animating || next === slide) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setSlide(next);
      setAnimating(false);
    }, 300);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      if (diff > 0 && slide < totalSlides - 1) goTo(slide + 1, "left");
      if (diff < 0 && slide > 0) goTo(slide - 1, "right");
    }
    touchStartX.current = null;
  };

  const gradient = `linear-gradient(135deg, ${colors.from}, ${colors.to})`;

  const slideContent = [
    // Slide 1: Overview
    <div key="overview" className="space-y-6">
      <div className="text-center">
        <div className="inline-block text-xs font-bold px-3 py-1 rounded-full mb-4 text-white" style={{ background: gradient }}>
          DNA Wrap
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">{data.display_name}</h2>
        <p className="text-lg font-semibold mb-1" style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {data.personality_type}
        </p>
        <p className="text-white/40 text-sm">{data.listening_style}</p>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-white"><AnimatedNumber target={data.dna_score} delay={300} />%</div>
          <div className="text-white/40 text-xs mt-1">Consistency</div>
          <div className="text-white/25 text-xs mt-0.5">{getTasteLabel(data.dna_score)}</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-white"><AnimatedNumber target={data.dominant_trait.value} delay={400} />%</div>
          <div className="text-white/40 text-xs mt-1 capitalize">{data.dominant_trait.name}</div>
          <div className="text-white/25 text-xs mt-0.5">Top trait</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4 text-center">
          <div className="text-2xl font-bold text-white"><AnimatedNumber target={data.tracks_analyzed} delay={500} /></div>
          <div className="text-white/40 text-xs mt-1">Tracks</div>
          <div className="text-white/25 text-xs mt-0.5">Analyzed</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Mood</div>
          <div className="text-lg font-bold" style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {getMoodLabel(data.avg_dna.valence || 0.5)}
          </div>
          <div className="text-white/25 text-xs mt-1">{Math.round((data.avg_dna.valence || 0) * 100)}% valence</div>
        </div>
        <div className="bg-white/5 rounded-2xl p-4">
          <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Energy</div>
          <div className="text-lg font-bold" style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            {getEnergyLabel(data.avg_dna.energy || 0.5)}
          </div>
          <div className="text-white/25 text-xs mt-1">{Math.round((data.avg_dna.energy || 0) * 100)}% energy</div>
        </div>
      </div>

      <div className="bg-white/5 rounded-2xl p-4">
        <div className="text-white/40 text-xs uppercase tracking-wider mb-2">Rarest Trait</div>
        <span className="font-semibold capitalize" style={{ background: gradient, WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          {data.rarest_trait.name}
        </span>
        <span className="text-white/40 text-xs ml-2">— only {data.rarest_trait.value}% of your DNA</span>
      </div>
    </div>,

    // Slide 2: Top Tracks
    <div key="tracks" className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-1">Top Tracks</h3>
        <p className="text-white/40 text-sm">Your most played right now</p>
      </div>
      <div className="space-y-3">
        {data.top_tracks.map((t, i) => (
          <div
            key={t.id}
            className="flex items-center gap-3 bg-white/5 rounded-2xl p-3"
            style={{
              opacity: visible ? 1 : 0,
              transform: visible ? "translateX(0)" : "translateX(-10px)",
              transition: `opacity 0.4s ease ${i * 0.1}s, transform 0.4s ease ${i * 0.1}s`,
            }}
          >
            <div className="text-white/30 text-sm font-bold w-5 text-center">{i + 1}</div>
            {t.image && <img src={t.image} alt={t.name} className="w-12 h-12 rounded-xl flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <div className="text-white text-sm font-semibold truncate">{t.name}</div>
              <div className="text-white/40 text-xs truncate">{t.artist}</div>
            </div>
            <div
              className="text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0"
              style={{ background: `${colors.from}22`, color: colors.from }}
            >
              #{i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>,

    // Slide 3: DNA Profile
    <div key="dna" className="space-y-6">
      <div className="text-center">
        <h3 className="text-xl font-bold text-white mb-1">DNA Profile</h3>
        <p className="text-white/40 text-sm">Your audio fingerprint across 9 dimensions</p>
      </div>
      <div className="space-y-3">
        {Object.entries(data.avg_dna).map(([key, val], i) => (
          <div key={key} className="flex items-center gap-3">
            <div className="text-white/40 text-xs w-24 text-right capitalize">{key}</div>
            <AnimatedBar value={val} from={colors.from} to={colors.to} delay={i * 80} />
            <div className="text-white/30 text-xs w-8">{Math.round(val * 100)}%</div>
          </div>
        ))}
      </div>

      {/* share section */}
      <div className="pt-4 border-t border-white/10">
        <div className="text-white/40 text-xs uppercase tracking-wider mb-4 text-center">Share your wrap</div>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => { navigator.clipboard.writeText(shareUrl); alert("Link copied!"); }}
            className="py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            Copy Link
          </button>
          <button
            onClick={() => {
              const text = `My music DNA Wrap — I'm "${data.personality_type}" on Song DNA. Check yours:`;
              window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(shareUrl)}`);
            }}
            className="py-3 rounded-2xl text-white text-sm font-medium transition-colors"
            style={{ background: gradient }}
          >
            Share on X
          </button>
          <button
            onClick={() => {
              const text = `My music DNA Wrap — I'm "${data.personality_type}" on Song DNA. Check yours: ${shareUrl}`;
              window.open(`sms:?body=${encodeURIComponent(text)}`);
            }}
            className="py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            Send via iMessage
          </button>
          <button
            onClick={() => {
              const text = `My music DNA Wrap — I'm "${data.personality_type}" on Song DNA. Check yours: ${shareUrl}`;
              window.open(`https://wa.me/?text=${encodeURIComponent(text)}`);
            }}
            className="py-3 rounded-2xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors"
          >
            Share on WhatsApp
          </button>
        </div>
        <div className="text-center mt-4">
          <div className="text-white/20 text-xs">song-dna-visualiser.vercel.app</div>
        </div>
      </div>
    </div>,
  ];

  return (
    <div
      className="max-w-lg mx-auto"
      style={{ opacity: visible ? 1 : 0, transform: visible ? "translateY(0)" : "translateY(20px)", transition: "opacity 0.6s ease, transform 0.6s ease" }}
    >
      {/* slide labels */}
      <div className="flex justify-center gap-6 mb-4">
        {["Overview", "Top Tracks", "DNA Profile"].map((label, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > slide ? "left" : "right")}
            className="text-xs font-medium transition-colors"
            style={{ color: slide === i ? colors.from : "rgba(255,255,255,0.3)" }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* progress dots */}
      <div className="flex justify-center gap-2 mb-6">
        {Array.from({ length: totalSlides }).map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i, i > slide ? "left" : "right")}
            className="rounded-full transition-all duration-300"
            style={{
              width: slide === i ? "24px" : "6px",
              height: "6px",
              background: slide === i ? gradient : "rgba(255,255,255,0.2)",
            }}
          />
        ))}
      </div>

      {/* card */}
      <div
        className="rounded-3xl overflow-hidden"
        style={{ background: gradient, padding: "2px" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        <div
          className="bg-gray-950 rounded-3xl p-8 min-h-96"
          style={{
            opacity: animating ? 0 : 1,
            transform: animating ? `translateX(${direction === "left" ? "-20px" : "20px"})` : "translateX(0)",
            transition: "opacity 0.3s ease, transform 0.3s ease",
          }}
        >
          {slideContent[slide]}
        </div>
      </div>

      {/* arrow nav */}
      <div className="flex justify-between mt-6">
        <button
          onClick={() => goTo(slide - 1, "right")}
          disabled={slide === 0}
          className="px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
        >
          ← Prev
        </button>
        <button
          onClick={() => goTo(slide + 1, "left")}
          disabled={slide === totalSlides - 1}
          className="px-6 py-3 rounded-full text-white text-sm font-medium transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: slide === totalSlides - 1 ? "rgba(255,255,255,0.1)" : gradient }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}