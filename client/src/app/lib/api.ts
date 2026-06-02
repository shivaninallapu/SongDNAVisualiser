import axios from "axios";

export const SPOTIFY_ID = "12164753523";

export async function searchTracks(query: string) {
  const res = await axios.get("/api/dna/search", {
    params: { q: query, spotify_id: SPOTIFY_ID },
  });
  return res.data.results;
}

export async function getTrackDna(trackId: string) {
  const res = await axios.get(`/api/dna/track/${trackId}`, {
    params: { spotify_id: SPOTIFY_ID },
  });
  return res.data;
}

export async function getSimilarTracks(trackId: string) {
  const res = await axios.get(`/api/dna/track/${trackId}/similar`, {
    params: { spotify_id: SPOTIFY_ID },
  });
  return res.data;
}

export async function saveDna(payload: {
  track_id: string;
  track_name: string;
  artist: string;
  image: string;
  features: Record<string, number>;
}) {
  const res = await axios.post("/api/saved/", {
    spotify_id: SPOTIFY_ID,
    ...payload,
  });
  return res.data;
}

export async function getSaved() {
  const res = await axios.get("/api/saved/", {
    params: { spotify_id: SPOTIFY_ID },
  });
  return res.data.saved;
}
export async function getPersonality() {
  const res = await axios.get("/api/personality/", {
    params: { spotify_id: SPOTIFY_ID },
  });
  return res.data;
}