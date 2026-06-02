from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import User
from spotify_service import get_audio_features, normalize_features
from dotenv import load_dotenv
import httpx
import numpy as np
import os

load_dotenv()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")

router = APIRouter(prefix="/personality")

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

@router.get("")
async def get_personality(spotify_id: str, db: Session = Depends(get_db)):
    token = await get_user_token(spotify_id, db)

    # fetch top 50 tracks across two time ranges
    track_ids = []
    async with httpx.AsyncClient() as client:
        for time_range in ["short_term", "medium_term"]:
            res = await client.get(
                "https://api.spotify.com/v1/me/top/tracks",
                params={"limit": 25, "time_range": time_range},
                headers={"Authorization": f"Bearer {token}"}
            )
            items = res.json().get("items", [])
            track_ids += [t["id"] for t in items]

    # deduplicate
    track_ids = list(dict.fromkeys(track_ids))[:50]

    if not track_ids:
        raise HTTPException(status_code=400, detail="No top tracks found. Listen to more music on Spotify first.")

    # compute DNA for each track
    vectors = []
    feature_keys = None
    for tid in track_ids:
        raw = await get_audio_features(tid, token)
        features = normalize_features(raw)
        if not features:
            continue
        if feature_keys is None:
            feature_keys = list(features.keys())
        vectors.append(list(features.values()))

    if not vectors:
        raise HTTPException(status_code=400, detail="Could not compute DNA for your tracks.")

    # average DNA vector
    avg_vec = np.mean(vectors, axis=0).tolist()
    std_vec = np.std(vectors, axis=0).tolist()
    avg_dna = dict(zip(feature_keys, [round(v, 4) for v in avg_vec]))

    # rule-based personality generation
    energy = avg_dna.get("energy", 0.5)
    valence = avg_dna.get("valence", 0.5)
    danceability = avg_dna.get("danceability", 0.5)
    acousticness = avg_dna.get("acousticness", 0.5)
    instrumentalness = avg_dna.get("instrumentalness", 0.5)
    speechiness = avg_dna.get("speechiness", 0.5)

    if energy > 0.7 and valence > 0.6:
        personality_type = "The Euphoric Architect"
        tagline = "You live for music that hits hard and feels even harder."
        description = "Your taste gravitates toward high-energy, feel-good music. You likely use music to amplify good moods and power through challenges. Playlists built for momentum and joy."
        listening_style = "Intensity Seeker"
        traits = ["High Energy", "Optimistic", "Driven"]
    elif energy > 0.7 and valence < 0.4:
        personality_type = "The Dark Architect"
        tagline = "Intensity is your love language."
        description = "You gravitate toward powerful, emotionally charged music with serious weight to it. High energy but emotionally complex — you feel music deeply and aren't afraid of the dark side."
        listening_style = "Emotional Diver"
        traits = ["Intense", "Complex", "Passionate"]
    elif energy < 0.4 and acousticness > 0.5:
        personality_type = "The Chill Philosopher"
        tagline = "Slow down. The best music rewards patience."
        description = "Acoustic textures and calm energy define your taste. You value intimacy and authenticity in music — the kind that sounds best at 2am with headphones on."
        listening_style = "Chill Architect"
        traits = ["Reflective", "Authentic", "Intimate"]
    elif danceability > 0.7:
        personality_type = "The Rhythm Chaser"
        tagline = "If it doesn't move you, what's the point?"
        description = "Groove and rhythm are at the core of your music taste. You instinctively reach for tracks with infectious beats and movement. Music is a physical experience for you."
        listening_style = "Rhythm Chaser"
        traits = ["Groovy", "Physical", "Infectious"]
    elif instrumentalness > 0.4:
        personality_type = "The Sonic Architect"
        tagline = "Words get in the way of the feeling."
        description = "You gravitate toward music as pure sound — texture, atmosphere, and composition over lyrics. Focus and mood come naturally when the music is just music."
        listening_style = "Mood Curator"
        traits = ["Atmospheric", "Focused", "Textural"]
    elif valence < 0.35:
        personality_type = "The Midnight Wanderer"
        tagline = "You find beauty in melancholy."
        description = "Your music leans toward the introspective and bittersweet. Emotional depth matters more than surface-level happiness — you use music to process, reflect, and feel."
        listening_style = "Emotional Diver"
        traits = ["Introspective", "Emotional", "Depth-seeking"]
    elif speechiness > 0.4:
        personality_type = "The Word Surgeon"
        tagline = "Lyrics are the whole point."
        description = "Words and delivery matter deeply to your music taste. Whether rap, spoken word, or lyric-heavy songs, you listen for what's being said as much as how it sounds."
        listening_style = "Adventurous Explorer"
        traits = ["Lyrical", "Articulate", "Sharp"]
    else:
        personality_type = "The Eclectic Wanderer"
        tagline = "Your taste refuses to be boxed in."
        description = "Your music DNA is beautifully balanced across dimensions — you're a true omnivore. Mood, context, and curiosity drive your listening more than any single genre or style."
        listening_style = "Adventurous Explorer"
        traits = ["Versatile", "Curious", "Open-minded"]

    personality = {
        "personality_type": personality_type,
        "tagline": tagline,
        "description": description,
        "traits": traits,
        "listening_style": listening_style,
    }

    return {
        "personality": personality,
        "avg_dna": avg_dna,
        "tracks_analyzed": len(vectors),
    }