"use client";
import { useState, useCallback } from "react";
import { searchTracks } from "../lib/api";

interface Track {
  id: string;
  name: string;
  artist: string;
  album: string;
  image: string;
}

interface Props {
  onSelect: (track: Track) => void;
}

export default function SearchBar({ onSelect }: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setQuery(val);
    if (timer) clearTimeout(timer);
    if (!val.trim()) { setResults([]); return; }
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const tracks = await searchTracks(val);
        setResults(tracks);
      } finally {
        setLoading(false);
      }
    }, 300);
    setTimer(t);
  }, [timer]);

  return (
    <div className="relative w-full max-w-xl" style={{ zIndex: 100 }}>
      <input
        type="text"
        value={query}
        onChange={handleChange}
        placeholder="Search any song..."
        className="w-full px-5 py-3 rounded-full bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:border-purple-400 text-lg backdrop-blur-sm"
      />
      {loading && (
        <div className="absolute right-4 top-3.5 text-white/50 text-sm">searching...</div>
      )}
      {results.length > 0 && (
        <div className="absolute top-14 left-0 right-0 bg-gray-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl" style={{ zIndex: 200 }}>
          {results.map((track) => (
            <button
              key={track.id}
              onClick={() => { onSelect(track); setResults([]); setQuery(""); }}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left"
            >
              {track.image && (
                <img src={track.image} alt={track.album} className="w-10 h-10 rounded-md" />
              )}
              <div>
                <div className="text-white font-medium text-sm">{track.name}</div>
                <div className="text-white/50 text-xs">{track.artist} · {track.album}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}