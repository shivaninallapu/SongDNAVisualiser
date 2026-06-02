from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User, SavedDna
from pydantic import BaseModel
import json, uuid

router = APIRouter(prefix="/saved")

class SaveRequest(BaseModel):
    spotify_id: str
    track_id: str
    track_name: str
    artist: str
    image: str
    features: dict

@router.post("/")
def save_dna(body: SaveRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.spotify_id == body.spotify_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    existing = db.query(SavedDna).filter(
        SavedDna.user_id == user.id,
        SavedDna.track_id == body.track_id
    ).first()

    if existing:
        return {"message": "Already saved", "id": existing.id}

    saved = SavedDna(
        id=str(uuid.uuid4()),
        user_id=user.id,
        track_id=body.track_id,
        track_name=body.track_name,
        artist=body.artist,
        image=body.image,
        features=json.dumps(body.features),
    )
    db.add(saved)
    db.commit()
    return {"message": "Saved", "id": saved.id}

@router.get("/")
def get_saved(spotify_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    items = db.query(SavedDna).filter(SavedDna.user_id == user.id).all()
    return {
        "saved": [
            {
                "id": s.id,
                "track_id": s.track_id,
                "track_name": s.track_name,
                "artist": s.artist,
                "image": s.image,
                "features": json.loads(s.features),
                "created_at": s.created_at,
            }
            for s in items
        ]
    }

@router.delete("/{saved_id}")
def delete_saved(saved_id: str, spotify_id: str, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    item = db.query(SavedDna).filter(
        SavedDna.id == saved_id,
        SavedDna.user_id == user.id
    ).first()

    if not item:
        raise HTTPException(status_code=404, detail="Not found")

    db.delete(item)
    db.commit()
    return {"message": "Deleted"}