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