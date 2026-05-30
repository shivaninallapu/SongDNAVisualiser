from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import RedirectResponse
from sqlalchemy.orm import Session
from database import get_db
from models import User
from dotenv import load_dotenv
import httpx, os, urllib.parse

load_dotenv()

router = APIRouter()

CLIENT_ID = os.getenv("SPOTIFY_CLIENT_ID")
CLIENT_SECRET = os.getenv("SPOTIFY_CLIENT_SECRET")
REDIRECT_URI = os.getenv("SPOTIFY_REDIRECT_URI")

SCOPES = "user-read-private user-read-email user-top-read user-library-read"

@router.get("/login")
def login():
    params = {
        "client_id": CLIENT_ID,
        "response_type": "code",
        "redirect_uri": REDIRECT_URI,
        "scope": SCOPES,
    }
    url = "https://accounts.spotify.com/authorize?" + urllib.parse.urlencode(params)
    return RedirectResponse(url)

@router.get("/callback")
async def callback(code: str, db: Session = Depends(get_db)):
    async with httpx.AsyncClient() as client:
        token_res = await client.post(
            "https://accounts.spotify.com/api/token",
            data={
                "grant_type": "authorization_code",
                "code": code,
                "redirect_uri": REDIRECT_URI,
            },
            headers={"Content-Type": "application/x-www-form-urlencoded"},
            auth=(CLIENT_ID, CLIENT_SECRET),
        )

    tokens = token_res.json()
    print("SPOTIFY RESPONSE:", tokens)  # add this line
    access_token = tokens.get("access_token")
    refresh_token = tokens.get("refresh_token")

    if not access_token:
        raise HTTPException(status_code=400, detail=f"Failed to get access token: {tokens}")

    async with httpx.AsyncClient() as client:
        profile_res = await client.get(
            "https://api.spotify.com/v1/me",
            headers={"Authorization": f"Bearer {access_token}"}
        )

    profile = profile_res.json()
    spotify_id = profile.get("id")
    display_name = profile.get("display_name")

    user = db.query(User).filter(User.spotify_id == spotify_id).first()
    if user:
        user.access_token = access_token
        user.refresh_token = refresh_token
    else:
        user = User(
            spotify_id=spotify_id,
            display_name=display_name,
            access_token=access_token,
            refresh_token=refresh_token,
        )
        db.add(user)

    db.commit()

    return {"message": f"Welcome {display_name}!", "spotify_id": spotify_id}