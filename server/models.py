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