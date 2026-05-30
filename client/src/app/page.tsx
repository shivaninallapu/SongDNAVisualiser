"use client";
import { useState } from "react";
import SearchBar from "./components/SearchBar";
import DnaHelix from "./components/DnaHelix";
import DnaRadar from "./components/RadarChart";
import { getTrackDna, getSimilarTracks } from "./lib/api";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
}

interface Similar {
  id: string;
  name: string;
  artist: string;
  image: string;
  similarity: number;
}

export default function Home() {
  const [track, setTrack] = useState<Track | null>(null);
  const [dna, setDna] = useState<Record<string, number> | null>(null);
  const [similar, setSimilar] = useState<Similar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"helix" | "radar">("helix");

  const handleSelect = async (t: Track) => {
    setTrack(t);
    setDna(null);
    setSimilar([]);
    setError(null);
    setLoading(true);

    try {
      const dnaRes = await getTrackDna(t.id);
      setDna(dnaRes.dna);
    } catch (e) {
      setError("Failed to load DNA for this track.");
      setLoading(false);
      return;
    }

    setLoading(false);

    try {
      const simRes = await getSimilarTracks(t.id);
      setSimilar(simRes.similar);
    } catch (e) {
      console.warn("Similar tracks failed — showing DNA only");
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white px-6 py-12">
      <div className="max-w-5xl mx-auto">

        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-3">
            Song DNA
          </h1>
          <p className="text-white/50 text-lg">Every song has a unique genetic fingerprint</p>
        </div>

        <div className="flex justify-center mb-12">
          <SearchBar onSelect={handleSelect} />
        </div>

        {error && (
          <div className="text-center text-red-400 mb-6">{error}</div>
        )}

        {loading && (
          <div className="text-center text-white/50 text-lg animate-pulse">
            Sequencing DNA...
          </div>
        )}

        {dna && track && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">

            <div>
              <div className="flex items-center gap-4 mb-6">
                {track.image && (
                  <img src={track.image} alt={track.album} className="w-16 h-16 rounded-xl shadow-lg" />
                )}
                <div>
                  <h2 className="text-xl font-semibold">{track.name}</h2>
                  <p className="text-white/50">{track.artist}</p>
                </div>
              </div>

              <div className="flex gap-3 mb-6">
                <button
                  onClick={() => setView("helix")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === "helix" ? "bg-purple-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                >
                  Helix view
                </button>
                <button
                  onClick={() => setView("radar")}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${view === "radar" ? "bg-purple-500 text-white" : "bg-white/10 text-white/60 hover:bg-white/20"}`}
                >
                  Radar view
                </button>
              </div>

              {view === "helix" ? <DnaHelix dna={dna} /> : <DnaRadar dna={dna} />}
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-4 text-white/80">
                Similar DNA matches
              </h3>
              {similar.length === 0 ? (
                <div className="text-white/30 text-sm">Loading matches...</div>
              ) : (
                <div className="space-y-3">
                  {similar.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelect(s as any)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      {s.image && (
                        <img src={s.image} alt={s.name} className="w-10 h-10 rounded-lg" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-xs text-white/50 truncate">{s.artist}</div>
                      </div>
                      <div className="text-purple-400 font-semibold text-sm flex-shrink-0">
                        {s.similarity}%
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>

          </div>
        )}
      </div>
    </main>
  );
}
