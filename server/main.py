import datetime
from itertools import chain
import json
from typing import List, Optional
import anthropic
from fastapi import FastAPI, Depends, HTTPException, Query, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from db import engine, Base, get_db
from models import GlucoseReading, Test, TimeSeriesEvent
from crud import combined_data_query, create_glucose_batch
import requests2
import crud
import base64
from fastapi.responses import JSONResponse
import os
from datetime import datetime
from detection import interesting_events, time_ranges_of_interest
from prompts import NUTRITION_FACTS_PLEASE_PROMPT

app = FastAPI()

origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Create the database tables
Base.metadata.create_all(bind=engine)

IMAGE_UPLOAD_DIRECTORY = "uploads"
os.makedirs(IMAGE_UPLOAD_DIRECTORY, exist_ok=True)

################################################################################
# read endpoints
################################################################################
@app.get("/interesting-events/")
def read_interesting_events(
    hyperglycemic_threshold: int = 180,
    hypoglycemic_threshold: int = 70,
    quickly_raising_threshold: float = 2.0,
    quickly_dropping_threshold: float = 2.0,
    lookback_minutes: int = 60,
    db: Session = Depends(get_db)
):
    glucose_readings = db.query(GlucoseReading).all()
    events = db.query(TimeSeriesEvent).all()
    times = time_ranges_of_interest(
        glucose_readings,
        hyperglycemic_threshold=hyperglycemic_threshold,
        hypoglycemic_threshold=hypoglycemic_threshold,
        quickly_dropping_threshold=quickly_dropping_threshold,
        quickly_raising_threshold=quickly_raising_threshold,
    )
    return interesting_events(times, events, lookback_minutes=lookback_minutes)


@app.get("/interesting-times/")
def read_interesting_times(
    hyperglycemic_threshold: int = 180,
    hypoglycemic_threshold: int = 70,
    rate_of_change_threshold: float = 2.0,
    db: Session = Depends(get_db)):
    glucose_readings = db.query(GlucoseReading).all()
    return time_ranges_of_interest(
        glucose_readings,
        hyperglycemic_threshold=hyperglycemic_threshold,
        hypoglycemic_threshold=hypoglycemic_threshold,
        quickly_dropping_threshold=rate_of_change_threshold,
        quickly_raising_threshold=rate_of_change_threshold
    )

@app.get("/combined-data/")
def get_all_data(
    start: datetime = Query(None, format="%Y-%m-%d %H:%M:%S"),
    end: datetime = Query(None, format="%Y-%m-%d %H:%M:%S"),
    type: List[str] = Query([]),
    db: Session = Depends(get_db)
):
    try:
        return combined_data_query(
            db=db,
            start=start,
            end=end,
            type=type
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.get("/glucose/", response_model=List[requests2.GlucoseCreate])
def get_glucose_data(
    start: Optional[datetime] = Query(None, format="%Y-%m-%d %H:%M:%S"),
    end: Optional[datetime] = Query(None, format="%Y-%m-%d %H:%M:%S"),
    db: Session = Depends(get_db)
):
    query = db.query(GlucoseReading)

    if start:
        query = query.filter(GlucoseReading.timestamp >= start)
    if end:
        query = query.filter(GlucoseReading.timestamp <= end)

    glucose_data = query.all()

    if not glucose_data:
        raise HTTPException(status_code=404, detail="No data found")

    return glucose_data

@app.get("/events/", response_model=List[requests2.TimeSeriesEventRead])
def read_events(
    skip: int = 0,
    limit: int = 100,
    start: Optional[datetime] = Query(None, format="%Y-%m-%d %H:%M:%S"),
    end: Optional[datetime] = Query(None, format="%Y-%m-%d %H:%M:%S"),
    type: Optional[str] = None,
    db: Session = Depends(get_db)
):
    try:
        return crud.get_time_series_events(
            db=db,
            skip=skip,
            limit=limit,
            start=start,
            end=end,
            type=type
        )
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))


################################################################################
# upload endpoints
################################################################################

@app.post("/events/", response_model=requests2.TimeSeriesEventRead)
def create_event(event: requests2.TimeSeriesEventCreate, db: Session = Depends(get_db)):
    return crud.create_time_series_event(db=db, event=event)

@app.post("/glucose/upload/")
def upload_glucose_data(
    batch: requests2.GlucoseBatchCreate, db: Session = Depends(get_db)
):
    try:
        return create_glucose_batch(db=db, glucose_records=batch.records)
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/events/batch/")
def batch_create_events(
    events: List[requests2.TimeSeriesEventCreate], db: Session = Depends(get_db)
):
    try:
        return [
            crud.create_time_series_event(db=db, event=event) for event in events
        ]
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

claude_model = "claude-3-5-sonnet-20240620"  # Model name for Claude API
client = anthropic.Anthropic()  # Initialize Claude client

@app.post("/upload-image/")
async def upload_image(file: UploadFile = File(...)):
    try:
        # Read the file content
        file_content = await file.read()

        # Convert the file content to base64
        encoded_image_data = base64.b64encode(file_content).decode("utf-8")
        image_media_type = file.content_type  # Get the file's media type

        # Construct the payload for Claude API
        message = client.messages.create(
            model=claude_model,
            max_tokens=1024,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {
                            "type": "image",
                            "source": {
                                "type": "base64",
                                "media_type": image_media_type,
                                "data": encoded_image_data,
                            },
                        },
                        {
                            "type": "text",
                            "text": NUTRITION_FACTS_PLEASE_PROMPT,
                        }
                    ],
                }
            ],
        )

        raw = "".join(
            chain.from_iterable(
                msg.text for msg in message.content
            )
        )

        json_response = json.loads(raw)
        # Return the response from Claude API
        return JSONResponse(content=json_response)

    except Exception as e:
        print(e)
        return JSONResponse(content={"error": str(e)}, status_code=500)

@app.post("/consequence/upload/")
def upload_consequence(consequence: requests2.CreateEventConsequence, db: Session = Depends(get_db)):
    return crud.create_event_consequence(db=db, event=consequence.event, consequence=consequence.consequence)

@app.post("/consequence/recommendation-prompt/")
def get_reccomendation(event: requests2.TimeSeriesEventCreate, db: Session = Depends(get_db)):
    prompt = crud.generate_consequences_prompt(db=db, event=event)

    message = client.messages.create(
        model=claude_model,
        max_tokens=1024,
        messages=[
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ],
            }
        ]
    )

    content = "".join(
        chain.from_iterable(
            msg.text for msg in message.content
        )
    )

    return JSONResponse(content={"result": content})

@app.delete("/events/{event_id}")
def delete_event(event_id: int, db: Session = Depends(get_db)):
    return crud.delete_timeseries_event(db=db, event_id=event_id)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="localhost", port=8000)

