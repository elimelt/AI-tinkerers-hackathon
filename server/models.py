import json
from sqlalchemy import Column, Integer, String, Text, Numeric, TIMESTAMP
from sqlalchemy.dialects.postgresql import JSONB
from db import Base


class Test(Base):
    __tablename__ = "test"

    id = Column(Integer, primary_key=True, index=True)
    message = Column(String, nullable=False)


class GlucoseReading(Base):
    __tablename__ = "glucose_readings"

    timestamp = Column(TIMESTAMP, primary_key=True, index=True)
    glucose_value = Column(Integer, nullable=False)

    def __repr__(self):
        return json.dumps(
            {
                "timestamp": self.timestamp.isoformat(),
                "glucose_value": self.glucose_value,
            }
        )


class TimeSeriesEvent(Base):
    __tablename__ = "time_series_events"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False)
    timestamp = Column(TIMESTAMP, nullable=False)
    data = Column(JSONB, nullable=True)
    description = Column(Text, nullable=True)

    def __repr__(self):
        return json.dumps(
            {
                "id": self.id,
                "type": self.type,
                "timestamp": self.timestamp.isoformat(),
                "data": self.data,
                "description": self.description,
            }
        )

class EventConsequence(Base):
    __tablename__ = "event_consequences"

    id = Column(Integer, primary_key=True, index=True)
    event = Column(JSONB, nullable=False)
    consequence = Column(Text, nullable=False)

    def __repr__(self):
        return json.dumps(
            {
                "id": self.id,
                "event": self.event,
                "consequence": self.consequence,
            }
        )