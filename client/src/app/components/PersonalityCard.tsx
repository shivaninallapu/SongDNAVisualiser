"use client";

interface Personality {
  personality_type: string;
  tagline: string;
  description: string;
  traits: string[];
  listening_style: string;
}

interface Props {
  personality: Personality;
  avg_dna: Record<string, number>;
  tracks_analyzed: number;
}

const STYLE_COLORS: Record<string, string> = {
  "Adventurous Explorer": "from-emerald-500 to-teal-500",
  "Mood Curator": "from-purple-500 to-pink-500",
  "Intensity Seeker": "from-red-500 to-orange-500",
  "Chill Architect": "from-blue-500 to-cyan-500",
  "Emotional Diver": "from-violet-500 to-purple-500",
  "Rhythm Chaser": "from-yellow-500 to-orange-500",
};

export default function PersonalityCard({ personality, avg_dna, tracks_analyzed }: Props) {
  const gradient = STYLE_COLORS[personality.listening_style] || "from-purple-500 to-pink-500";

  return (
    <div className="max-w-2xl mx-auto">
      <div className={`relative rounded-3xl bg-gradient-to-br ${gradient} p-0.5 mb-6`}>
        <div className="bg-gray-950 rounded-3xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🧬</div>
            <div className={`inline-block text-xs font-semibold px-3 py-1 rounded-full bg-gradient-to-r ${gradient} text-white mb-3`}>
              {personality.listening_style}
            </div>
            <h2 className={`text-3xl font-bold bg-gradient-to-r ${gradient} bg-clip-text text-transparent mb-2`}>
              {personality.personality_type}
            </h2>
            <p className="text-white/70 text-lg italic">"{personality.tagline}"</p>
          </div>

          <p className="text-white/60 text-center leading-relaxed mb-8">
            {personality.description}
          </p>

          <div className="flex justify-center gap-3 flex-wrap mb-8">
            {personality.traits.map((trait) => (
              <span
                key={trait}
                className="px-4 py-2 rounded-full bg-white/10 text-white/80 text-sm font-medium"
              >
                {trait}
              </span>
            ))}
          </div>

          <div className="space-y-3">
            <h3 className="text-white/40 text-xs font-semibold uppercase tracking-wider mb-4">Your Average DNA</h3>
            {Object.entries(avg_dna).map(([key, val]) => (
              <div key={key} className="flex items-center gap-3">
                <div className="text-white/50 text-xs w-24 text-right capitalize">{key}</div>
                <div className="flex-1 h-2 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full bg-gradient-to-r ${gradient}`}
                    style={{ width: `${val * 100}%` }}
                  />
                </div>
                <div className="text-white/40 text-xs w-8">{Math.round(val * 100)}%</div>
              </div>
            ))}
          </div>

          <div className="text-center mt-6 text-white/30 text-xs">
            Based on {tracks_analyzed} of your top tracks
          </div>
        </div>
      </div>
    </div>
  );
}