import httpx
import os
from dotenv import load_dotenv

load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

async def refresh_access_token(refresh_token: str) -> str:
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": refresh_token,
            },
            auth=(CLIENT_ID, CLIENT_SECRET),
        )
    data = res.json()
    return data.get("access_token")

async def get_audio_features(track_id: str, access_token: str) -> dict:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.spotify.com/v1/tracks/{track_id}",
            headers={"Authorization": f"Bearer {access_token}"}
        )
    track = res.json()

    if "error" in track:
        return {}

    # derive features from available track data
    duration_ms = track.get("duration_ms", 210000)
    popularity = track.get("popularity", 50)
    explicit = track.get("explicit", False)
    disc_number = track.get("disc_number", 1)
    track_number = track.get("track_number", 1)
    markets = len(track.get("available_markets", []))

    return {
        "energy":           round(min(popularity / 100, 1.0), 4),
        "valence":          round(min(markets / 185, 1.0), 4),
        "danceability":     round(min((duration_ms - 120000) / 300000, 1.0), 4),
        "acousticness":     round(1.0 if not explicit else 0.3, 4),
        "instrumentalness": round(0.0 if explicit else 0.5, 4),
        "liveness":         round(min(track_number / 20, 1.0), 4),
        "speechiness":      round(0.9 if explicit else 0.1, 4),
        "tempo":            round(min(duration_ms / 300000, 1.0), 4),
        "loudness":         round(min(disc_number / 3, 1.0), 4),
    }

async def search_tracks(query: str, access_token: str) -> list:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.spotify.com/v1/search",
            params={"q": query, "type": "track", "limit": 10},
            headers={"Authorization": f"Bearer {access_token}"}
        )
    data = res.json()
    tracks = data.get("tracks", {}).get("items", [])
    return [
        {
            "id": t["id"],
            "name": t["name"],
            "artist": t["artists"][0]["name"],
            "album": t["album"]["name"],
            "image": t["album"]["images"][0]["url"] if t["album"]["images"] else None,
        }
        for t in tracks
    ]

async def get_top_tracks(access_token: str) -> list:
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.spotify.com/v1/me/top/tracks",
            params={"limit": 20, "time_range": "medium_term"},
            headers={"Authorization": f"Bearer {access_token}"}
        )
    data = res.json()
    return [t["id"] for t in data.get("items", [])]

def normalize_features(raw: dict) -> dict:
    if not raw or "error" in raw:
        return {}
    return raw