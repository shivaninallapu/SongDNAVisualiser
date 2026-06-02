from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from spotify_service import get_audio_features, search_tracks, normalize_features
from dotenv import load_dotenv
import numpy as np
import httpx
import os

load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

router = APIRouter(prefix="/dna")

async def get_user_token(spotify_id: str, db: Session) -> str:
    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Login first.")
    
    async with httpx.AsyncClient() as client:
        test = await client.get(
            "https://api.spotify.com/v1/me",
            headers={"Authorization": f"Bearer {user.access_token}"}
        )
    
    if test.status_code == 200:
        return user.access_token
    
    async with httpx.AsyncClient() as client:
        res = await client.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "refresh_token",
                "refresh_token": user.refresh_token,
            },
            auth=(CLIENT_ID, CLIENT_SECRET),
        )
    
    tokens = res.json()
    new_token = tokens.get("access_token")
    if not new_token:
        raise HTTPException(status_code=401, detail="Session expired. Please login again at http://127.0.0.1:8000/login")
    
    user.access_token = new_token
    db.commit()
    return new_token

@router.get("/search")
async def search(q: str, spotify_id: str, db: Session = Depends(get_db)):
    token = await get_user_token(spotify_id, db)
    results = await search_tracks(q, token)
    return {"results": results}

# IMPORTANT: /similar must come BEFORE /track/{track_id}
@router.get("/track/{track_id}/similar")
async def similar_tracks(track_id: str, spotify_id: str, db: Session = Depends(get_db)):
    token = await get_user_token(spotify_id, db)

    raw = await get_audio_features(track_id, token)
    target = normalize_features(raw)
    if not target:
        raise HTTPException(status_code=400, detail="Could not fetch target track features")

    target_vec = np.array(list(target.values()))

    # get track name and artist name
    async with httpx.AsyncClient() as client:
        track_res = await client.get(
            f"https://api.spotify.com/v1/tracks/{track_id}",
            headers={"Authorization": f"Bearer {token}"}
        )
    track_data = track_res.json()
    artist_name = track_data.get("artists", [{}])[0].get("name", "")
    track_name = track_data.get("name", "")

    # search with track name and artist name for broader results
    raw_candidates = await search_tracks(track_name, token)
    artist_candidates = await search_tracks(artist_name, token)

    all_candidates = {t["id"]: t for t in raw_candidates + artist_candidates}
    all_candidates.pop(track_id, None)
    candidates = list(all_candidates.values())
    print(f"Combined candidates: {len(candidates)}")

    scored = []
    for t in candidates:
        cand_features = normalize_features(await get_audio_features(t["id"], token))
        if not cand_features:
            continue
        cand_vec = np.array(list(cand_features.values()))
        similarity = float(np.dot(target_vec, cand_vec) / (
            np.linalg.norm(target_vec) * np.linalg.norm(cand_vec) + 1e-9
        ))
        scored.append({
            "id": t["id"],
            "name": t["name"],
            "artist": t["artist"],
            "image": t["image"],
            "similarity": round(similarity * 100, 1),
            "dna": cand_features,
        })

    scored.sort(key=lambda x: x["similarity"], reverse=True)
    return {"target_dna": target, "similar": scored[:10]}

@router.get("/track/{track_id}")
async def get_track_dna(track_id: str, spotify_id: str, db: Session = Depends(get_db)):
    token = await get_user_token(spotify_id, db)
    raw = await get_audio_features(track_id, token)
    features = normalize_features(raw)
    if not features:
        raise HTTPException(status_code=400, detail="Could not fetch audio features")
    return {"track_id": track_id, "dna": features}