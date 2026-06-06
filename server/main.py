from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import Base, engine
import auth, dna, saved, personality, wrap

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Song DNA API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(dna.router)
app.include_router(saved.router)
app.include_router(personality.router)
app.include_router(wrap.router)

@app.get("/")
def root():
    return {"status": "Song DNA API is running"}