from pydantic import BaseModel
from typing import Dict, List, Optional
from datetime import datetime


class GlucoseCreate(BaseModel):
    timestamp: datetime
    glucose_value: int


class GlucoseBatchCreate(BaseModel):
    records: List[GlucoseCreate]


class GloucoseReadByTimestamp(BaseModel):
    timestamp: datetime


class TimeSeriesEventCreate(BaseModel):
    type: str
    timestamp: datetime
    description: Optional[str] = None
    data: Optional[Dict] = None


class TimeSeriesEventRead(BaseModel):
    id: int
    type: str
    timestamp: datetime
    data: Optional[Dict] = None
    description: Optional[str] = None

    class Config:
        orm_mode = True


class CreateEventConsequence(BaseModel):
    event: TimeSeriesEventCreate
    consequence: str
