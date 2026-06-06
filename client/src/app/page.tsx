"use client";
import { useState } from "react";
import SearchBar from "./components/SearchBar";
import DnaHelix from "./components/DnaHelix";
import DnaRadar from "./components/RadarChart";
import PersonalityCard from "./components/PersonalityCard";
import { getTrackDna, getSimilarTracks, saveDna, getSaved, getPersonality, generateWrap, getWrap } from "./lib/api";
import WrapCard from "./components/WrapCard";

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

type Panel = "home" | "visualizer" | "collection" | "personality" | "wrap";

export default function Home() {
  const [track, setTrack] = useState<Track | null>(null);
  const [dna, setDna] = useState<Record<string, number> | null>(null);
  const [similar, setSimilar] = useState<Similar[]>([]);
  const [loading, setLoading] = useState(false);
  const [similarLoading, setSimilarLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"helix" | "radar">("helix");
  const [savedList, setSavedList] = useState<any[]>([]);
  const [panel, setPanel] = useState<Panel>("home");
  const [saved, setSaved] = useState(false);
  const [personality, setPersonality] = useState<any>(null);
  const [personalityLoading, setPersonalityLoading] = useState(false);
  const [wrapData, setWrapData] = useState<any>(null);
  const [wrapLoading, setWrapLoading] = useState(false);

  const handleSelect = async (t: Track) => {
    setTrack(t);
    setDna(null);
    setSimilar([]);
    setError(null);
    setLoading(true);
    setSaved(false);
    setPanel("visualizer");

    try {
      const dnaRes = await getTrackDna(t.id);
      setDna(dnaRes.dna);
    } catch (e) {
      setError("Failed to load DNA for this track.");
      setLoading(false);
      return;
    }
    setLoading(false);

    setSimilarLoading(true);
    try {
      const simRes = await getSimilarTracks(t.id);
      setSimilar(simRes.similar);
    } catch (e: any) {
      console.error("Similar tracks error:", e?.response?.data || e?.message || e);
    } finally {
      setSimilarLoading(false);
    }
  };

  const handleSave = async () => {
    if (!track || !dna) return;
    await saveDna({
      track_id: track.id,
      track_name: track.name,
      artist: track.artist,
      image: track.image,
      features: dna,
    });
    setSaved(true);
  };
  const handleWrap = async () => {
    setPanel("wrap");
    if (wrapData) return;
    setWrapLoading(true);
    try {
      const data = await generateWrap();
      setWrapData(data);
    } catch (e) {
      console.error("Wrap failed:", e);
    } finally {
      setWrapLoading(false);
    }
  };
  const handleLoadCollection = async () => {
    const items = await getSaved();
    setSavedList(items);
    setPanel("collection");
  };

  const handlePersonality = async () => {
    setPanel("personality");
    if (personality) return; // already loaded
    setPersonalityLoading(true);
    try {
      const data = await getPersonality();
      setPersonality(data);
    } catch (e) {
      console.error("Personality failed:", e);
    } finally {
      setPersonalityLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-950 text-white">
      {/* nav */}
      <nav className="border-b border-white/10 px-6 py-4 flex items-center justify-between">
        <button
          onClick={() => setPanel("home")}
          className="text-xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent hover:opacity-80 transition-opacity"
        >
          Song DNA
        </button>
        <div className="flex items-center gap-3">
          {panel !== "home" && (
            <button
              onClick={() => setPanel("home")}
              className="px-4 py-2 rounded-full text-sm font-medium bg-white/10 hover:bg-white/20 text-white/70 transition-colors"
            >
              ← Home
            </button>
          )}
          <button
            onClick={handlePersonality}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${panel === "personality" ? "bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20 text-white/70"}`}
          >
            My Personality
          </button>
          <button
            onClick={handleWrap}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${panel === "wrap" ? "bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20 text-white/70"}`}
          >
            DNA Wrap
          </button>
          <button
            onClick={handleLoadCollection}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${panel === "collection" ? "bg-purple-500 text-white" : "bg-white/10 hover:bg-white/20 text-white/70"}`}
          >
            My Collection
          </button>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-10">

        {/* HOME PANEL */}
        {panel === "home" && (
          <div>
            {/* hero — overflow visible so dropdown isn't clipped */}
            <div className="relative rounded-3xl mb-12 bg-gradient-to-br from-purple-900/60 via-pink-900/40 to-gray-900 border border-white/10 p-12 text-center" style={{ overflow: "visible" }}>
              <div className="absolute top-0 left-1/4 w-72 h-72 bg-purple-500/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-pink-500/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative z-10">
                <div className="flex justify-center gap-2 mb-6">
                  {["energy", "valence", "tempo", "dance", "acoustic", "live"].map((_, i) => (
                    <div
                      key={i}
                      className="w-1.5 rounded-full bg-gradient-to-t from-purple-500 to-pink-400 opacity-80"
                      style={{ height: `${Math.round(30 + Math.sin(i * 1.2) * 20 + 20)}px` }}
                    />
                  ))}
                </div>
                <h1 className="text-6xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-purple-300 bg-clip-text text-transparent mb-4">
                  Song DNA
                </h1>
                <p className="text-white/60 text-xl mb-8 max-w-lg mx-auto">
                  Decode the genetic fingerprint of any song. Discover what makes music unique.
                </p>
                {/* search outside the overflow:hidden card */}
                <div className="flex justify-center" style={{ position: "relative", zIndex: 200 }}>
                  <SearchBar onSelect={handleSelect} />
                </div>
              </div>
            </div>

            {/* feature cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-3xl mb-3">🧬</div>
                <h3 className="font-semibold mb-2">DNA Helix</h3>
                <p className="text-white/50 text-sm">Visualize 9 audio dimensions as a unique genetic fingerprint for any song.</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-3xl mb-3">🔍</div>
                <h3 className="font-semibold mb-2">Similarity Engine</h3>
                <p className="text-white/50 text-sm">Cosine similarity matching finds songs with the closest DNA profile.</p>
              </div>
              <div className="bg-white/5 rounded-2xl p-6 border border-white/10">
                <div className="text-3xl mb-3">💾</div>
                <h3 className="font-semibold mb-2">DNA Collection</h3>
                <p className="text-white/50 text-sm">Save and revisit the DNA fingerprints of your favorite songs.</p>
              </div>
            </div>
          </div>
        )}

        {/* WRAP PANEL */}
        {panel === "wrap" && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setPanel("home")}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
              >
                Back
              </button>
              <h2 className="text-xl font-semibold">Your DNA Wrap</h2>
            </div>
            {wrapLoading ? (
              <div className="text-center py-20">
                <div className="text-white/50 text-lg animate-pulse">Generating your DNA Wrap...</div>
                <div className="text-white/30 text-sm mt-2">Analyzing your top tracks and collection</div>
              </div>
            ) : wrapData ? (
              <WrapCard
                data={wrapData}
                shareUrl={`${window.location.origin}/wrap/${wrapData.wrap_id}`}
              />
            ) : (
              <div className="text-center text-white/30 py-20">Failed to generate wrap</div>
            )}
          </div>
        )}

        {error && panel === "visualizer" && (
          <div className="text-center text-red-400 mb-6">{error}</div>
        )}

        {loading && (
          <div className="text-center text-white/50 text-lg animate-pulse mt-20">
            Sequencing DNA...
          </div>
        )}

        {/* PERSONALITY PANEL */}
        {panel === "personality" && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setPanel("home")}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-xl font-semibold">Your Music Personality</h2>
            </div>
            {personalityLoading ? (
              <div className="text-center py-20">
                <div className="text-white/50 text-lg animate-pulse">Analyzing your music DNA...</div>
                <div className="text-white/30 text-sm mt-2">Looking at your top 50 tracks</div>
              </div>
            ) : personality ? (
              <PersonalityCard
                personality={personality.personality}
                avg_dna={personality.avg_dna}
                tracks_analyzed={personality.tracks_analyzed}
              />
            ) : (
              <div className="text-center text-white/30 py-20">Failed to load personality</div>
            )}
          </div>
        )}

        {/* COLLECTION PANEL */}
        {panel === "collection" && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <button
                onClick={() => setPanel("home")}
                className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white/70 text-sm transition-colors"
              >
                ← Back
              </button>
              <h2 className="text-xl font-semibold">My DNA Collection</h2>
            </div>
            {savedList.length === 0 ? (
              <div className="text-center py-20">
                <div className="text-6xl mb-4">💾</div>
                <div className="text-white/30 text-lg">No saved DNAs yet</div>
                <div className="text-white/20 text-sm mt-2">Search a song and hit Save DNA</div>
                <button
                  onClick={() => setPanel("home")}
                  className="mt-6 px-6 py-2 rounded-full bg-purple-500 hover:bg-purple-600 text-white text-sm transition-colors"
                >
                  Search songs
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {savedList.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => {
                      handleSelect({
                      id: s.track_id,
                      name: s.track_name,
                      artist: s.artist,
                      album: "",
                      image: s.image,
                    });
                  }}
                    className="p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left group"
                  >
                    {s.image && (
                      <img src={s.image} alt={s.track_name} className="w-full aspect-square object-cover rounded-lg mb-3 group-hover:opacity-80 transition-opacity" />
                    )}
                    <div className="text-sm font-medium truncate">{s.track_name}</div>
                    <div className="text-xs text-white/50 truncate">{s.artist}</div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* VISUALIZER PANEL */}
        {panel === "visualizer" && dna && track && !loading && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white/5 rounded-2xl p-6">
              <div className="flex items-center gap-4 mb-6">
                {track.image && (
                  <img src={track.image} alt={track.name} className="w-16 h-16 rounded-xl shadow-lg flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-semibold truncate">{track.name}</h2>
                  <p className="text-white/50 truncate">{track.artist}</p>
                </div>
                <button
                  onClick={handleSave}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors flex-shrink-0 ${saved ? "bg-green-500 text-white" : "bg-purple-500 hover:bg-purple-600 text-white"}`}
                >
                  {saved ? "Saved ✓" : "Save DNA"}
                </button>
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

            <div className="bg-white/5 rounded-2xl p-6">
              <h3 className="text-base font-semibold mb-4 text-white/80">Similar DNA matches</h3>
              {similarLoading ? (
                <div className="space-y-3">
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-14 rounded-xl bg-white/5 animate-pulse" />
                  ))}
                </div>
              ) : similar.length === 0 ? (
                <div className="text-white/30 text-sm text-center py-8">No matches found</div>
              ) : (
                <div className="space-y-2">
                  {similar.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSelect(s as any)}
                      className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/10 transition-colors text-left"
                    >
                      {s.image && (
                        <img src={s.image} alt={s.name} className="w-10 h-10 rounded-lg flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-xs text-white/50 truncate">{s.artist}</div>
                      </div>
                      <div className="text-purple-400 font-semibold text-xs flex-shrink-0">
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
