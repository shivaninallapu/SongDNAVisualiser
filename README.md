# Song DNA

> Decode the genetic fingerprint of any song. Discover what makes music unique.

**Live Demo:** https://song-dna-visualiser-2.vercel.app/

---

## What It Does

Song DNA visualizes the hidden audio fingerprint of any Spotify track across 9 dimensions — energy, valence, danceability, acousticness, instrumentalness, liveness, speechiness, tempo, and loudness — and renders them as an animated DNA helix or radar chart.

- Search any song on Spotify
- Visualize its DNA as an animated helix or radar chart
- Discover similar songs using cosine similarity matching
- Save DNA profiles to your personal collection
- Analyze your music personality based on your top 50 tracks

---

## Tech Stack

### Frontend
- **Next.js 16** (App Router, TypeScript)
- **Tailwind CSS** for styling
- **D3.js** for the DNA helix visualization
- **Recharts** for the radar chart
- **Axios** for API calls

### Backend
- **FastAPI** (Python) REST API
- **PostgreSQL** database
- **SQLAlchemy** ORM with Alembic migrations
- **httpx** for async Spotify API calls

### Infrastructure
- **Vercel** — frontend deployment
- **Railway** — backend + PostgreSQL deployment
- **Spotify Web API** — track data and audio features

---

## Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│                 │  HTTPS  │                  │  HTTPS  │                 │
│   Next.js 16    │────────▶│   FastAPI        │────────▶│  Spotify API    │
│   (Vercel)      │◀────────│   (Railway)      │◀────────│                 │
│                 │         │                  │         └─────────────────┘
└─────────────────┘         └────────┬─────────┘
                                     │
                                     │ SQLAlchemy
                                     ▼
                            ┌──────────────────┐
                            │   PostgreSQL      │
                            │   (Railway)       │
                            └──────────────────┘
```

---

## Key Technical Decisions

### Cosine Similarity for Song Matching
Songs are represented as 9-dimensional feature vectors. Cosine similarity measures the angle between two vectors — a score of 1.0 means identical DNA, 0 means completely different. This approach is computationally efficient and scale-invariant, meaning a quiet acoustic song and a loud acoustic song still register as similar.

```python
similarity = np.dot(target_vec, candidate_vec) / (
    np.linalg.norm(target_vec) * np.linalg.norm(candidate_vec)
)
```

### Feature Normalization
Spotify's raw audio features use different scales — tempo ranges 0–250 BPM, loudness ranges −60 to 0 dB. All features are normalized to 0–1 before comparison so no single dimension dominates the similarity calculation.

### OAuth 2.0 with Automatic Token Refresh
Implements Spotify's Authorization Code flow. Access tokens expire after 1 hour — the backend automatically detects expiry and uses the refresh token to get a new one transparently, so users never need to re-authenticate.

### Route Ordering in FastAPI
FastAPI matches routes top-to-bottom. `/track/{track_id}/similar` must be registered before `/track/{track_id}` or FastAPI incorrectly matches `similar` as the `track_id` parameter. This is a subtle but critical ordering constraint.

---

## Running Locally

### Prerequisites
- Python 3.11+
- Node.js 18+
- Docker (for PostgreSQL)
- Spotify Developer account

### Backend Setup

```bash
# Start PostgreSQL
docker run --name songdna-db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=pw \
  -e POSTGRES_DB=songdna \
  -p 5432:5432 \
  -d postgres

# Install dependencies
cd server
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Fill in your Spotify credentials and database URL

# Start server
uvicorn main:app --reload --port 8000
```

### Frontend Setup

```bash
cd client
npm install
npm run dev
```

Visit `http://localhost:3000`

### Environment Variables

**Backend (`server/.env`)**
```
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
SPOTIFY_REDIRECT_URI=http://127.0.0.1:8000/callback
DATABASE_URL=postgresql+psycopg2://postgres:pw@localhost:5432/songdna
SECRET_KEY=your_secret_key
```

**Frontend (`client/.env.local`)**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/login` | Spotify OAuth login |
| GET | `/callback` | OAuth callback |
| GET | `/dna/search?q=` | Search tracks |
| GET | `/dna/track/:id` | Get track DNA |
| GET | `/dna/track/:id/similar` | Find similar tracks |
| POST | `/saved` | Save a DNA profile |
| GET | `/saved` | Get saved profiles |
| DELETE | `/saved/:id` | Delete a saved profile |
| GET | `/personality` | Get music personality |

---

## Music Personality Engine

Analyzes the user's top 50 Spotify tracks across two time ranges (`short_term` and `medium_term`), computes an average DNA vector, and classifies listening style into one of 8 personality archetypes based on dominant audio traits:

| Archetype | Trigger Condition |
|-----------|-------------------|
| The Euphoric Architect | High energy + high valence |
| The Dark Architect | High energy + low valence |
| The Chill Philosopher | Low energy + high acousticness |
| The Rhythm Chaser | High danceability |
| The Sonic Architect | High instrumentalness |
| The Midnight Wanderer | Low valence |
| The Word Surgeon | High speechiness |
| The Eclectic Wanderer | Balanced across all dimensions |

---

## What I Learned

- Implementing OAuth 2.0 PKCE flow and token refresh logic from scratch
- Building a cosine similarity engine on normalized feature vectors
- Debugging FastAPI route ordering conflicts with dynamic path parameters
- Handling Spotify API restrictions by deriving proxy audio features from track metadata
- Configuring Next.js rewrites to proxy API calls and avoid CORS in production

---

## Author

Shivani Nallapu 