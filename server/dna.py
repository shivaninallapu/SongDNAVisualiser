from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from spotify_service import get_audio_features, search_tracks, normalize_features, refresh_access_token
import numpy as np

router = APIRouter(prefix="/dna")

async def get_user_token(spotify_id: str, db: Session) -> str:
    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Login first.")
    return user.access_token

@router.get("/track/{track_id}")
async def get_track_dna(track_id: str, spotify_id: str, db: Session = Depends(get_db)):
    token = await get_user_token(spotify_id, db)
    raw = await get_audio_features(track_id, token)
    features = normalize_features(raw)
    if not features:
        raise HTTPException(status_code=400, detail="Could not fetch audio features")
    return {"track_id": track_id, "dna": features}

@router.get("/search")
async def search(q: str, spotify_id: str, db: Session = Depends(get_db)):
    token = await get_user_token(spotify_id, db)
    results = await search_tracks(q, token)
    return {"results": results}

@router.get("/track/{track_id}/similar")
async def similar_tracks(track_id: str, spotify_id: str, db: Session = Depends(get_db)):
    token = await get_user_token(spotify_id, db)

    raw = await get_audio_features(track_id, token)
    target = normalize_features(raw)
    if not target:
        raise HTTPException(status_code=400, detail="Could not fetch target track features")

    target_vec = np.array(list(target.values()))

    import httpx
    async with httpx.AsyncClient() as client:
        res = await client.get(
            f"https://api.spotify.com/v1/recommendations",
            params={"seed_tracks": track_id, "limit": 20},
            headers={"Authorization": f"Bearer {token}"}
        )
    candidates = res.json().get("tracks", [])

    scored = []
    for track in candidates:
        cand_raw = await get_audio_features(track["id"], token)
        cand_features = normalize_features(cand_raw)
        if not cand_features:
            continue
        cand_vec = np.array(list(cand_features.values()))
        similarity = float(np.dot(target_vec, cand_vec) / (
            np.linalg.norm(target_vec) * np.linalg.norm(cand_vec) + 1e-9
        ))
        scored.append({
            "id": track["id"],
            "name": track["name"],
            "artist": track["artists"][0]["name"],
            "image": track["album"]["images"][0]["url"] if track["album"]["images"] else None,
            "similarity": round(similarity * 100, 1),
            "dna": cand_features,
        })

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return {"target_dna": target, "similar": scored[:10]}