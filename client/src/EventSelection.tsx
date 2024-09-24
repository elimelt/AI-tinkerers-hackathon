import { useEffect, useState } from "react";
import './EventSelection.css';

type EventType = {
  id: number;
  type: string;
  description: string;
  timestamp: string;
  data?: any;
};

type EventRange = {
  range: [string, string];
  events: EventType[];
};

type EventData = {
  [key: string]: EventRange[];
};

const EventSelection = () => {
  const [data, setData] = useState<EventData | null>(null); // Proper type for API data
  const [selectedType, setSelectedType] = useState<string | null>(null); // Type for selected type
  const [visibleEvents, setVisibleEvents] = useState<EventRange[] | null>(null); // Type for visible events
  const [loading, setLoading] = useState(true);
  const [types, setTypes] = useState<string[] | null>(null); // Type for event types

  // Fetch event data from the API
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("http://localhost:8000/interesting-events");
        const data: EventData = await response.json();
        setData(data);
        setTypes(Object.keys(data)); // Extract keys as event types
        setSelectedType(Object.keys(data)[0]); // Automatically select the first type
      } catch (error) {
        console.error("Error fetching data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Update visible events when selectedType or data changes
  useEffect(() => {
    if (!loading && data && selectedType) {
      setVisibleEvents(data[selectedType]);
    }
  }, [selectedType, data, loading]);

  const allLoaded = !loading && data && types && selectedType;

  if (!allLoaded) {
    return <div>Loading...</div>;
  }

  const handleRemoveEvent = (rangeIdx: number, eventId: number) => {
    if (!visibleEvents || !selectedType || !data) return;

    const updatedEvents = visibleEvents.map((range, idx) => {
      if (idx === rangeIdx) {
        return {
          ...range,
          events: range.events.filter(event => event.id !== eventId),
        };
      }
      return range;
    });

    setVisibleEvents(updatedEvents);
    setData({ ...data, [selectedType]: updatedEvents });
  };

  return (
    <div className="event-selection-container">
      {/* Event type switcher */}
      <div className="button-group">
        {types.map(type => (
          <button
            key={type}
            className={`event-button ${selectedType === type ? 'selected' : ''}`}
            onClick={() => setSelectedType(type)}
          >
            {type}
          </button>
        ))}
      </div>

      {/* Event ranges and events */}
      {visibleEvents && visibleEvents.map((range, rangeIdx) => (
        <div key={rangeIdx} className="event-range">
          <div className="event-range-header">
            Range: {new Date(range.range[0]).toLocaleString()} - {new Date(range.range[1]).toLocaleString()}
          </div>
          <ul className="event-list">
            {range.events.length > 0 ? (
              range.events.map(event => (
                <li key={event.id} className="event-item">
                  <div className="event-details">
                    <strong>{event.type}</strong>: {event.description} at {new Date(event.timestamp).toLocaleString()}
                  </div>
                  <button
                    className="remove-event-button"
                    onClick={() => handleRemoveEvent(rangeIdx, event.id)}
                  >
                    X
                  </button>
                </li>
              ))
            ) : (
              <li className="no-events">No events</li>
            )}
          </ul>
        </div>
      ))}
    </div>
  );
};

export default EventSelection;
