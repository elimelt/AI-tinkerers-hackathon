import { useState, useEffect } from 'react';
import { useCopilotAction } from '@copilotkit/react-core';

interface Event {
  id: number;
  type: string;
  timestamp: string;
  data: object;
  description: string | null;
}

const useEvents = () => {
  const [eventData, setEventData] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEventsData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/events/');
        const result = await response.json();
        // Sort the events by timestamp
        const sortedEvents = result.sort(
          (a: Event, b: Event) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
        setEventData(sortedEvents);
      } catch (error) {
        console.error('Error fetching events data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEventsData();
  }, []);

  const addEvent = async (newEvent: Event) => {
    try {
      const response = await fetch('http://localhost:8000/events/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newEvent),
      });
      const addedEvent = await response.json();
      setEventData((prev) => [...prev, addedEvent]);
    } catch (error) {
      console.error('Error adding event:', error);
    }
  };

  const deleteEvent = async (id: number) => {
    try {
      await fetch(`http://localhost:8000/events/${id}`, {
        method: 'DELETE',
      });
      setEventData((prev) => prev.filter((event) => event.id !== id));
    } catch (error) {
      console.error('Error deleting event:', error);
    }
  };

  useCopilotAction({
    name: 'addEvent',
    description: 'Add a event to the events table',
    parameters: [
      {
        name: 'events',
        description: 'The events added from the user.',
        type: 'object[]',
        attributes: [
          {
            name: 'type',
            type: 'string',
            description: 'The type of the event.',
          },
          {
            name: 'description',
            type: 'string',
            description: 'The description of the event.',
          },
        ],
      },
    ],
    handler: ({ events }) => {
      const { type, description } = events[0] as {
        type: string;
        description: string;
      };
      const newEvent: Event = {
        id: Date.now(),
        type,
        timestamp: new Date().toISOString(),
        data: {},
        description,
      };
      addEvent(newEvent);
    },
  });

  useCopilotAction({
    name: 'deleteEvent',
    description: 'Delete a event from the events table',
    parameters: [
      {
        name: 'id',
        type: 'number',
        description: 'The id of the event',
        required: true,
      },
    ],
    handler: ({ id }) => {
      deleteEvent(id);
    },
  });

  return { eventData, loading, addEvent, deleteEvent };
};

export default useEvents;
