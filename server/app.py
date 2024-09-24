from fastapi import FastAPI, HTTPException
from datetime import datetime
import json

app = FastAPI()

# In-memory state management, a dictionary where keys are session IDs
state_store = {}

# Function to load glucose readings from JSON file
def load_glucose_data():
    with open('./data/readings.json') as f:
        return json.load(f)

# Function to load event data from JSON file (sleep, exercise, meals, calories)
def load_event_data():
    with open('./data/events.json') as f:
        return json.load(f)

# Endpoint to fetch glucose data for a specific date and manage state
@app.get("/get-glucose")
def get_glucose(date: str, session_id: str):
    glucose_data = load_glucose_data()
    glucose_info = glucose_data.get(date)
    
    if not glucose_info:
        raise HTTPException(status_code=404, detail="No glucose data available for the provided date")
    
    # Update state for the session
    state_store[session_id] = {"last_action": "get_glucose", "date": date}
    
    return {"date": date, "glucose_data": glucose_info}

# Endpoint to fetch events (meals, exercise, sleep) for a specific date and manage state
@app.get("/get-events")
def get_events(date: str, session_id: str):
    event_data = load_event_data()
    events_info = event_data.get(date)
    
    if not events_info:
        raise HTTPException(status_code=404, detail="No event data available for the provided date")
    
    # Update state for the session
    state_store[session_id] = {"last_action": "get_events", "date": date}
    
    return {"date": date, "events": events_info}

# Endpoint to check the current state for a session
@app.get("/get-state")
def get_state(session_id: str):
    session_state = state_store.get(session_id)
    if not session_state:
        raise HTTPException(status_code=404, detail="No state found for the session")
    
    return {"session_id": session_id, "state": session_state}

# Test endpoint to fetch today's date
@app.get("/get-today")
def get_today(session_id: str):
    today_date = datetime.now().strftime("%Y-%m-%d")
    
    # Update state for the session
    state_store[session_id] = {"last_action": "get_today", "date": today_date}
    
    return {"today": today_date}

# Running the app (when using Uvicorn)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
