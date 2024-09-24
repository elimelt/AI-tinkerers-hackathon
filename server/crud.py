from datetime import datetime
from datetime import datetime
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from itertools import chain
from models import EventConsequence, GlucoseReading, TimeSeriesEvent
from requests2 import GlucoseCreate, TimeSeriesEventCreate
from sqlalchemy.orm import Session
from typing import List, Optional, Union

from langchain_core.callbacks import (
    AsyncCallbackManagerForToolRun,
    CallbackManagerForToolRun,
)
from langchain_core.tools import BaseTool
from pydantic import BaseModel, Field

from db import engine, get_db, SessionLocal


class CombinedDataInput(BaseModel):
    # skip: int = (Field(description="Number of skip records default is 0"),)
    # limit: int = (Field(description="Number of maximum records default is 100"),)
    start: datetime = (
        Field(description="Start datetime for the records. This is required"),
    )
    end: datetime = (
        Field(description="End datetime for the records. This is required"),
    )
    type: List[str] = Field(
        description="List of types of data out of possible types: insulin, sleep, food, exercise, glucose"
    )


import models


def create_glucose(db: Session, glucose: GlucoseCreate):
    db_glucose = GlucoseReading(
        timestamp=glucose.timestamp,
        glucose_value=glucose.glucose_value,
    )
    db.add(db_glucose)
    db.commit()
    db.refresh(db_glucose)
    return db_glucose


def create_glucose_batch(db: Session, glucose_records: list[GlucoseCreate]):
    db_glucose_list = [
        GlucoseReading(
            timestamp=record.timestamp,
            glucose_value=record.glucose_value,
        )
        for record in glucose_records
    ]
    db.bulk_save_objects(db_glucose_list)
    db.commit()


def get_glucose(db: Session):
    return db.query(GlucoseReading).all()


def get_glucose_since(db: Session, timestamp: int):
    return db.query(GlucoseReading).filter(GlucoseReading.timestamp >= timestamp).all()


def create_time_series_event(db: Session, event: TimeSeriesEventCreate):
    db_event = TimeSeriesEvent(
        type=event.type,
        timestamp=event.timestamp,
        data=event.data,
        description=event.description,
    )
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    return db_event


def get_time_series_events_by_type(
    db: Session, type: str, skip: int = 0, limit: int = 100
):
    return (
        db.query(TimeSeriesEvent)
        .filter(TimeSeriesEvent.type == type)
        .offset(skip)
        .limit(limit)
        .all()
    )


def get_time_series_events(
    db: Session,
    skip: int = 0,
    limit: int = 100,
    start: Optional[datetime] = None,
    end: Optional[datetime] = None,
    type: Optional[str] = None,
):
    query = db.query(models.TimeSeriesEvent)

    if start:
        query = query.filter(models.TimeSeriesEvent.timestamp >= start)
    if end:
        query = query.filter(models.TimeSeriesEvent.timestamp <= end)
    if type:
        query = query.filter(models.TimeSeriesEvent.type == type)

    return query.offset(skip).limit(limit).all()


def combined_data_query(
    input_data: CombinedDataInput,
) -> List[Union[GlucoseReading, TimeSeriesEvent]]:

    db = SessionLocal()
    glucose_query = db.query(GlucoseReading)
    events_query = db.query(TimeSeriesEvent)

    glucose_query = glucose_query.filter(GlucoseReading.timestamp >= input_data.start)
    events_query = events_query.filter(TimeSeriesEvent.timestamp >= input_data.start)

    glucose_query = glucose_query.filter(GlucoseReading.timestamp <= input_data.end)
    events_query = events_query.filter(TimeSeriesEvent.timestamp <= input_data.end)

    if input_data.type:
        if "glucose" not in input_data.type:
            glucose_query = glucose_query.filter(False)
        events_query = events_query.filter(TimeSeriesEvent.type.in_(input_data.type))

    # glucose_query = glucose_query.offset(input_data.skip).limit(input_data.limit)
    # events_query = events_query.offset(input_data.skip).limit(input_data.limit)
    glucose_data = glucose_query.all()
    events_data = events_query.all()

    combined_data = sorted(
        chain(glucose_data, events_data),
        key=lambda x: x.timestamp if hasattr(x, "timestamp") else x.timestamp,
    )

    return combined_data


def create_event_consequence(
    db: Session, event: TimeSeriesEventCreate, consequence: str
):
    db_event = {
        "type": event.type,
        "data": event.data,
        "description": event.description,
    }
    db_consequence = EventConsequence(event=db_event, consequence=consequence)
    db.add(db_consequence)
    db.commit()
    db.refresh(db_consequence)
    return db_consequence


def generate_consequences_prompt(event: TimeSeriesEventCreate, db: Session) -> str:
    all_consequences = db.query(EventConsequence).all()

    preamble = """
    You are a diabetes specialist and are being given data from a patient of yours.
    The data consists of a series of events and their consequences.

    For example, an event might be a patient eating a meal, and the consequence might be hyperglycemia.

    consequences are structured as follows:

    <JSON event data> -> <consequence>

    Given the list of consequences below, as well as the event in question, please select the most likely consequence,
    and make a recommendation to the patient based on that consequence. You should also provide a brief explanation of your reasoning.

    Your response should be structured as only JSON of the following structure:

    {
        detail: string,
        sources: string[]
    }
    detail should be no more than 3 sentences. You should start out detail similarly to the following:

    "Based on your historical data, ______ will most likely result in ______. I recommend that you ______."

    sources should be a string[] of examples of past events that support your recommendation. If you have no direct sources,
    feel free to extrapolate based on other related events, or outside knowledge.

    for example:

    {
        detail: "Based on your historical data, eating a meal will most likely result in hyperglycemia. I recommend that you take a walk after eating.",
        sources: ["eating Sun-dried tomatoes on 2021-01-01 resulted in hyperglycemia"]
    }
    """

    consequences = "\n".join(
        [
            f"{consequence.event} -> {consequence.consequence}"
            for consequence in all_consequences
        ]
    )

    event = f"event in question: {event}"
    return f"{preamble}\n{consequences}\n{event}"

def delete_timeseries_event(db: Session, event_id: int):
    db.query(TimeSeriesEvent).filter(TimeSeriesEvent.id == event_id).delete()
    db.commit()
    return {"message": "Event deleted successfully"}
