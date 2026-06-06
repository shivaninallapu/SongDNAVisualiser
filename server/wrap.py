from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, SavedDna, DnaWrap
from spotify_service import get_audio_features, normalize_features
from dotenv import load_dotenv
import httpx
import numpy as np
import os
import json
import uuid

load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

router = APIRouter(prefix="/wrap")

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
            data={"grant_type": "refresh_token", "refresh_token": user.refresh_token},
            auth=(CLIENT_ID, CLIENT_SECRET),
        )
    tokens = res.json()
    new_token = tokens.get("access_token")
    if not new_token:
        raise HTTPException(status_code=401, detail="Session expired.")
    user.access_token = new_token
    db.commit()
    return new_token

def classify_personality(avg_dna: dict) -> tuple:
    energy = avg_dna.get("energy", 0.5)
    valence = avg_dna.get("valence", 0.5)
    danceability = avg_dna.get("danceability", 0.5)
    acousticness = avg_dna.get("acousticness", 0.5)
    instrumentalness = avg_dna.get("instrumentalness", 0.5)
    speechiness = avg_dna.get("speechiness", 0.5)

    if energy > 0.7 and valence > 0.6:
        return "The Euphoric Architect", "Intensity Seeker"
    elif energy > 0.7 and valence < 0.4:
        return "The Dark Architect", "Emotional Diver"
    elif energy < 0.4 and acousticness > 0.5:
        return "The Chill Philosopher", "Chill Architect"
    elif danceability > 0.7:
        return "The Rhythm Chaser", "Rhythm Chaser"
    elif instrumentalness > 0.4:
        return "The Sonic Architect", "Mood Curator"
    elif valence < 0.35:
        return "The Midnight Wanderer", "Emotional Diver"
    elif speechiness > 0.4:
        return "The Word Surgeon", "Adventurous Explorer"
    else:
        return "The Eclectic Wanderer", "Adventurous Explorer"

@router.post("/generate")
async def generate_wrap(spotify_id: str, db: Session = Depends(get_db)):
    token = await get_user_token(spotify_id, db)
    user = db.query(User).filter(User.spotify_id == spotify_id).first()

    # fetch top tracks
    top_tracks = []
    async with httpx.AsyncClient() as client:
        res = await client.get(
            "https://api.spotify.com/v1/me/top/tracks",
            params={"limit": 10, "time_range": "medium_term"},
            headers={"Authorization": f"Bearer {token}"}
        )
    items = res.json().get("items", [])
    top_track_ids = [t["id"] for t in items[:5]]
    top_tracks_meta = [
        {
            "id": t["id"],
            "name": t["name"],
            "artist": t["artists"][0]["name"],
            "image": t["album"]["images"][0]["url"] if t["album"]["images"] else None,
        }
        for t in items[:5]
    ]

    # get DNA for top tracks
    vectors = []
    feature_keys = None
    top_tracks_with_dna = []
    for meta in top_tracks_meta:
        raw = await get_audio_features(meta["id"], token)
        features = normalize_features(raw)
        if not features:
            continue
        if feature_keys is None:
            feature_keys = list(features.keys())
        vectors.append(list(features.values()))
        top_tracks_with_dna.append({**meta, "dna": features})

    # get saved DNA collection
    saved = db.query(SavedDna).filter(SavedDna.user_id == user.id).all()
    for s in saved:
        features = json.loads(s.features)
        if feature_keys is None:
            feature_keys = list(features.keys())
        vectors.append(list(features.values()))

    if not vectors:
        raise HTTPException(status_code=400, detail="Not enough data to generate wrap.")

    # compute average DNA
    avg_vec = np.mean(vectors, axis=0).tolist()
    std_vec = np.std(vectors, axis=0).tolist()
    avg_dna = dict(zip(feature_keys, [round(v, 4) for v in avg_vec]))

    # dominant and rarest traits
    sorted_traits = sorted(avg_dna.items(), key=lambda x: x[1], reverse=True)
    dominant_trait = sorted_traits[0][0]
    dominant_val = round(sorted_traits[0][1] * 100)
    rarest_trait = sorted_traits[-1][0]
    rarest_val = round(sorted_traits[-1][1] * 100)

    # DNA score — consistency (lower std = more consistent)
    consistency = round((1 - float(np.mean(std_vec))) * 100)

    # personality
    personality_type, listening_style = classify_personality(avg_dna)

    # save wrap
    wrap_id = str(uuid.uuid4())[:8]
    wrap = DnaWrap(
        id=wrap_id,
        user_id=user.id,
        spotify_id=spotify_id,
        display_name=user.display_name,
        personality_type=personality_type,
        listening_style=listening_style,
        avg_dna=json.dumps(avg_dna),
        top_tracks=json.dumps(top_tracks_with_dna),
        dominant_trait=f"{dominant_trait}:{dominant_val}",
        rarest_trait=f"{rarest_trait}:{rarest_val}",
        dna_score=str(consistency),
    )
    db.add(wrap)
    db.commit()

    return {
        "wrap_id": wrap_id,
        "display_name": user.display_name,
        "personality_type": personality_type,
        "listening_style": listening_style,
        "avg_dna": avg_dna,
        "top_tracks": top_tracks_with_dna,
        "dominant_trait": {"name": dominant_trait, "value": dominant_val},
        "rarest_trait": {"name": rarest_trait, "value": rarest_val},
        "dna_score": consistency,
        "tracks_analyzed": len(vectors),
    }

@router.get("/{wrap_id}")
def get_wrap(wrap_id: str, db: Session = Depends(get_db)):
    wrap = db.query(DnaWrap).filter(DnaWrap.id == wrap_id).first()
    if not wrap:
        raise HTTPException(status_code=404, detail="Wrap not found")
    return {
        "wrap_id": wrap.id,
        "display_name": wrap.display_name,
        "personality_type": wrap.personality_type,
        "listening_style": wrap.listening_style,
        "avg_dna": json.loads(wrap.avg_dna),
        "top_tracks": json.loads(wrap.top_tracks),
        "dominant_trait": {
            "name": wrap.dominant_trait.split(":")[0],
            "value": int(wrap.dominant_trait.split(":")[1]),
        },
        "rarest_trait": {
            "name": wrap.rarest_trait.split(":")[0],
            "value": int(wrap.rarest_trait.split(":")[1]),
        },
        "dna_score": int(wrap.dna_score),
        "created_at": wrap.created_at,
    }