from sqlalchemy import Column, String, DateTime
from sqlalchemy.sql import func
from database import Base
import uuid

class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    spotify_id = Column(String, unique=True, nullable=False)
    display_name = Column(String)
    access_token = Column(String)
    refresh_token = Column(String)
    created_at = Column(DateTime, server_default=func.now())
class SavedDna(Base):
    __tablename__ = "saved_dnas"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, nullable=False)
    track_id = Column(String, nullable=False)
    track_name = Column(String)
    artist = Column(String)
    image = Column(String)
    features = Column(String)  
    created_at = Column(DateTime, server_default=func.now())

class DnaWrap(Base):
    __tablename__ = "dna_wraps"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4())[:8])
    user_id = Column(String, nullable=False)
    spotify_id = Column(String, nullable=False)
    display_name = Column(String)
    personality_type = Column(String)
    listening_style = Column(String)
    avg_dna = Column(String)  # JSON string
    top_tracks = Column(String)  # JSON string
    dominant_trait = Column(String)
    rarest_trait = Column(String)
    dna_score = Column(String)
    created_at = Column(DateTime, server_default=func.now())