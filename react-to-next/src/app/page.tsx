/* eslint-disable react/display-name */
'use client';
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faLightbulb } from '@fortawesome/free-solid-svg-icons';
import { CopilotPopup } from '@copilotkit/react-ui';
import useEvents from '../hooks/useEvents';
import PhotoCapture from '../../../client/src/PhotoCapture';

// Type definitions
interface GlucoseData {
  timestamp: string;
  event_type: string;
  glucose_value: number;
}

interface Event {
  id: number;
  type: string;
  timestamp: string;
  data: any;
  description: string | null;
}

interface EventRange {
  range: [string, string];
  events: Event[];
}

interface EventData {
  [key: string]: EventRange[];
}

const BloodSugarChart: React.FC<{
  filteredData: GlucoseData[];
  timeRanges?: [string, string][];
  setSelectedRangeIdx?: (idx: number | null) => void;
  selectedRangeIdx?: number | null;
  // eslint-disable-next-line react/display-name
}> = React.memo(
  ({
    filteredData,
    timeRanges = [],
    setSelectedRangeIdx = () => {},
    selectedRangeIdx = null,
  }) => {
    const handleLineClick = useCallback(
      (rangeId: number) => {
        setSelectedRangeIdx(rangeId === selectedRangeIdx ? null : rangeId);
      },
      [selectedRangeIdx, setSelectedRangeIdx]
    );

    return (
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={filteredData}>
          <XAxis dataKey="timestamp" />
          <YAxis domain={[0, 300]} />
          <Tooltip />
          <ReferenceLine y={250} stroke="#ffd700" strokeDasharray="3 3" />
          <ReferenceLine y={70} stroke="#ff0000" strokeDasharray="3 3" />
          <Line
            type="monotone"
            dataKey="glucose_value"
            stroke="#3b82f6"
            strokeWidth={2}
          />
          {timeRanges.map((range, i) => (
            <ReferenceLine
              key={i}
              type="monotone"
              stroke={selectedRangeIdx === i ? '#ff0000' : '#00ff00'}
              strokeWidth={10}
              segment={[
                { x: range[0], y: 0 },
                { x: range[1], y: 0 },
              ]}
              onClick={() => handleLineClick(i)}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    );
  }
);

const Dashboard: React.FC<{
  glucoseData: GlucoseData[];
  eventData: Event[];
}> = React.memo(({ glucoseData }) => {
  const [timeRange, setTimeRange] = useState(24);
  const [filterType, setFilterType] = useState<string>('all');
  const { eventData, addEvent, deleteEvent } = useEvents();
  const [eventDescription, setEventDescription] = useState('');
  const [eventType, setEventType] = useState<string>('');
  const eventTypes = eventData.map((event) => event.type); // Extract event types
  const uniqueEventTypes = Array.from(new Set(eventTypes)).sort(); // Remove duplicates and sort alphabetically

  const filteredData = useMemo(() => {
    const now = new Date();
    const cutoff = new Date(now.getTime() - timeRange * 60 * 60 * 1000);
    return glucoseData.filter((item) => new Date(item.timestamp) > cutoff);
  }, [glucoseData, timeRange]);

  const filteredEventData = useMemo(() => {
    if (filterType === 'all') return eventData;
    return eventData.filter((event) => event.type === filterType);
  }, [eventData, filterType]);

  const timeRangeButtons = useMemo(
    () => [
      { label: '1 hr', value: 1 },
      { label: '3 hr', value: 3 },
      { label: '6 hr', value: 6 },
      { label: '12 hr', value: 12 },
      { label: '24 hr', value: 24 },
    ],
    []
  );

  const handleTimeRangeChange = useCallback((value: number) => {
    setTimeRange(value);
  }, []);

  const handleAddEvent = () => {
    const newEvent = {
      id: Date.now(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data: {},
      description: eventDescription,
    };
    addEvent(newEvent);
    setEventDescription('');
    setEventType('');
  };

  // Sort the filtered events by timestamp
  const sortedEventData = filteredEventData.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return (
    <div className="mx-auto p-4 flex flex-col items-center">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
      <div className="flex flex-col md:flex-row w-full">
        <div className="flex-1 mb-4 md:mb-0">
          <div className="p-4 rounded-lg shadow mb-4">
            <div className="flex justify-between mb-2">
              {/* {timeRangeButtons.map((button) => (
                <button
                  key={button.value}
                  onClick={() => handleTimeRangeChange(button.value)}
                  className={`px-2 py-1 rounded ${
                    timeRange === button.value
                      ? 'bg-blue-500 text-white'
                      : 'text-blue-500'
                  }`}
                >
                  {button.label}
                </button>
              ))} */}
            </div>
            <h3 className="text-lg font-semibold mb-2 text-left">
              Blood Sugar
            </h3>
            <BloodSugarChart filteredData={filteredData} />
          </div>
          <div className=" p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Events</h3>
            <div className="flex items-center mb-4">
              <input
                type="text"
                value={eventDescription}
                onChange={(e) => setEventDescription(e.target.value)}
                placeholder="Enter event description"
                className="border rounded p-2 mr-4 w-1/2"
              />
              <input
                type="text"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                placeholder="Enter event type (insulin, food, exercise)"
                className="border rounded p-2 mr-2 w-1/2 "
              />
            </div>
            <button
              onClick={handleAddEvent}
              className="bg-blue-500 text-white rounded p-2 w-full mb-4"
            >
              Add Event
            </button>
            <div className="flex justify-end mb-4">
              <label htmlFor="eventTypeFilter" className="mr-2">
                Filter by Type:
              </label>
              <select
                id="eventTypeFilter"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
                className="border rounded p-1 focus:outline-none"
              >
                <option value="all">All</option>
                {uniqueEventTypes.map((type) => (
                  <option key={type} value={type}>
                    {type}
                  </option>
                ))}
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full table-fixed">
                <thead>
                  <tr>
                    <th className="py-2 px-4 text-left w-1/4">ID</th>
                    <th className="py-2 px-4 text-left w-1/4">Date</th>
                    <th className="py-2 px-4 text-left w-1/4">Time (UTC)</th>
                    <th className="py-2 px-4 text-left w-1/4">Type</th>
                    <th className="py-2 px-4 text-left w-1/4">Description</th>
                    <th className="py-2 px-4 text-left w-1/4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedEventData.map((event, index) => (
                    <tr
                      key={event.id}
                      className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}
                    >
                      <td className="py-2 px-4 text-left">{event.id}</td>
                      <td className="py-2 px-4 text-left">
                        {event.timestamp.split('T')[0]}
                      </td>
                      <td className="py-2 px-4 text-left">
                        {event.timestamp.split('T')[1]}
                      </td>
                      <td className="py-2 px-4 text-left">{event.type}</td>
                      <td className="py-2 px-4 text-left">
                        {event.description || 'NA'}
                      </td>
                      <td className="py-2 px-4 text-left">
                        <button
                          onClick={() => deleteEvent(event.id)}
                          className="text-red-500"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
});

const UploadComponent: React.FC = () => {
  const [type, setType] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [timestamp] = useState<string>(new Date().toISOString());
  const [data, setData] = useState<Record<string, any>>({});
  const [key, setKey] = useState<string>('');
  const [value, setValue] = useState<string>('');
  const [llmOutput, setLlmOutput] = useState<{
    detail: string;
    sources: string[];
  }>({detail: '', sources: []});
  const [loading, setLoading] = useState<boolean>(false);

  const handleAddKeyValue = () => {
    if (key && value) {
      setData((prevData) => ({
        ...prevData,
        [key]: value,
      }));
      setKey('');
      setValue('');
    }
  };

  const handleSubmit = () => {
    const payload = {
      type,
      timestamp,
      description,
      data,
    };
    setLoading(true);

    const url = 'http://localhost:8000/consequence/recommendation-prompt/';
    fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    })
      .then((response) => response.json())
      .then((data) => {
        const res = data.result;
        setLlmOutput(JSON.parse(res));
      })
      .catch((error) => {
        console.error('Error:', error);
      })
      .finally(() => {
        setLoading(false)
      })
  };

  return (
    <div className=" p-6 rounded-lg shadow-lg">
      <div className="mb-4">
        <label htmlFor="type" className="block text-sm font-medium  mb-1">
          Type
        </label>
        <input
          id="type"
          type="text"
          value={type}
          onChange={(e) => setType(e.target.value)}
          placeholder="Enter type"
          className="w-full px-3 py-2 bg-gray-100  rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div className="mb-4">
        <label
          htmlFor="description"
          className="block text-sm font-medium  mb-1"
        >
          Description
        </label>
        <textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Enter description"
          className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          rows={3}
        />
      </div>

      <div className="flex mb-4">
        <div className="flex-1 mr-2">
          <label
            htmlFor="key"
            className="block text-sm font-medium mb-1"
          >
            Attribute Name
          </label>
          <input
            id="key"
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="Enter key"
            className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div className="flex-1 ml-2">
          <label
            htmlFor="value"
            className="block text-sm font-medium mb-1"
          >
            Attribute Value
          </label>
          <input
            id="value"
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="Enter value"
            className="w-full px-3 py-2 bg-gray-100 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      <button
        type="button"
        onClick={handleAddKeyValue}
        className="mb-4 px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
      >
        Add Attribute
      </button>

      <div className="mb-4">
        <strong className="block text-sm font-medium text-gray-300 mb-1">
          Current Data:
        </strong>
        <pre className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          {JSON.stringify(data, null, 2)}
        </pre>
      </div>

      <button
        type="button"
        onClick={handleSubmit}
        disabled={loading}
        className="w-full px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-500"
      >
        {loading ? "..." : "Submit"}
      </button>

      <div className="mt-4">
        <p className="bg-gray-100 p-3 rounded-md overflow-x-auto">
          {llmOutput.detail}
        </p>
        <ul
          className="bg-gray-100 p-3 rounded-md overflow-x-auto"
        >
          {llmOutput.sources.map((source, index) => (
            <li key={index}>{source}</li>
          ))}
        </ul>

        </div>
    </div>
  );
};

const Understand: React.FC = () => {
  return (
    <div className="mx-auto p-4 max-w-2xl">
      <h2 className="text-2xl font-bold mb-4 ">Predict</h2>
      <UploadComponent />
    </div>
  );
};

const Explore: React.FC<{
  glucoseData: GlucoseData[];
  interestingEvents: {
    events: EventData[];
    range: string[];
  };
  allEvents: Event[];
  onAIClick: () => void;
}> = React.memo(
  ({ glucoseData, interestingEvents = [], allEvents, onAIClick }) => {
    const [selectedType, setSelectedType] = useState<string | null>(null);
    const [selectedRangeIdx, setSelectedRangeIdx] = useState<number | null>(
      null
    );
    const [eventsDisplayed, setEventsDisplayed] = useState<Event[]>(allEvents);
    const [selectedEvents, setSelectedEvents] = useState<Set<number>>(
      new Set()
    );
    const [buttonText, setButtonText] = useState<string>("Remember");


    useEffect(() => {
      if (interestingEvents) {
        setSelectedType(Object.keys(interestingEvents)[0]);
      }
    }, [interestingEvents]);

    const visibleEvents = useMemo(
      () => (selectedType ? interestingEvents[selectedType] : []),
      [selectedType, interestingEvents]
    );

    const timeRanges = useMemo(() => {
      console.log(`visibleEvents: `, visibleEvents);
      return visibleEvents ? visibleEvents.map((event) => event.range) : [];
    }, [visibleEvents]);

    const handleTypeChange = useCallback(
      (e: React.ChangeEvent<HTMLSelectElement>) => {
        setSelectedType(e.target.value);
        setSelectedRangeIdx(null);
        setSelectedEvents(new Set());
        setButtonText("Remember")
      },
      []
    );

    const updateSelectedRangeIdx = useCallback(
      (idx: number) => {
        setButtonText("Remember")
        setSelectedRangeIdx(idx);
        setEventsDisplayed(visibleEvents[idx].events);
        setSelectedEvents(new Set());
      },
      [visibleEvents]
    );

    const handleCheckboxChange = useCallback((index: number) => {
      setSelectedEvents((prevSelected) => {
        const newSelected = new Set(prevSelected);
        setButtonText("Remember")
        if (newSelected.has(index)) {
          newSelected.delete(index);
        } else {
          newSelected.add(index);
        }
        return newSelected;
      });
    }, []);

    const handleRememberClick = useCallback(() => {
      const eventsToRemember = eventsDisplayed.filter((_, index) =>
        selectedEvents.has(index)
      );
      const url = 'http://localhost:8000/consequence/upload/';

      setButtonText("Remembering...")
      eventsToRemember.forEach((event) => {
        const payload = {
          event,
          consequence: 'string',
        };

        fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        })
          .then((response) => response.json())
          .then((data) => {
            console.log('Success:', data);
          })
          .catch((error) => {
            console.error('Error:', error);
          });
      });

      setButtonText("Done")
    }, [eventsDisplayed, selectedEvents]);

    const showCheckboxes = selectedType !== null && selectedRangeIdx !== null;

    return (
      <div className="mx-auto p-4 flex flex-col items-center">
        <h2 className="text-2xl font-bold mb-4">Explore</h2>
        <div className="flex flex-col md:flex-row w-full">
          <div className="flex-1 mb-4 md:mb-0">
            <div className="p-4 rounded-lg shadow mb-4">
              <div className="flex justify-between mb-2">
                <select
                  value={selectedType || ''}
                  onChange={handleTypeChange}
                  className="border rounded p-1"
                >
                  {interestingEvents &&
                    Object.keys(interestingEvents).map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                </select>
              </div>
              <h3 className="text-lg font-semibold mb-2 text-left">
                Blood Sugar
              </h3>
              <BloodSugarChart
                filteredData={glucoseData}
                timeRanges={timeRanges}
                setSelectedRangeIdx={updateSelectedRangeIdx}
                selectedRangeIdx={selectedRangeIdx}
              />
            </div>
            <div className="p-4 rounded-lg shadow">
              <button type="button" onClick={onAIClick} className="mb-4">
                <FontAwesomeIcon
                  icon={faLightbulb}
                  className="ml-2 text-yellow-500"
                />{' '}
                Click me for AI
              </button>
              <h3 className="font-semibold mb-2">Events</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full table-fixed">
                  <thead>
                    <tr>
                      <th className="py-2 px-4 text-left w-1/5">Date</th>
                      <th className="py-2 px-4 text-left w-1/5">Time (UTC)</th>
                      <th className="py-2 px-4 text-left w-1/5">Type</th>
                      <th className="py-2 px-4 text-left w-1/5">Description</th>
                      {showCheckboxes && (
                        <th className="py-2 px-4 text-left w-1/5">Select</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {eventsDisplayed.map((event, index) => (
                      <tr
                        key={index}
                        className={`${
                          index % 2 === 0 ? 'bg-gray-100' : 'bg-white'
                        }`}
                      >
                        <td className="py-2 px-4 text-left">
                          {event.timestamp.split('T')[0]}
                        </td>
                        <td className="py-2 px-4 text-left">
                          {event.timestamp.split('T')[1]}
                        </td>
                        <td className="py-2 px-4 text-left">{event.type}</td>
                        <td className="py-2 px-4 text-left">
                          {event.description || 'NA'}
                        </td>
                        {showCheckboxes && (
                          <td className="py-2 px-4 text-left">
                            <input
                              type="checkbox"
                              checked={selectedEvents.has(index)}
                              onChange={() => handleCheckboxChange(index)}
                              className="form-checkbox h-5 w-5 text-blue-600"
                            />
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {showCheckboxes && (
                <button
                  onClick={handleRememberClick}
                  className="mt-4 bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                  disabled={selectedEvents.size === 0}
                >
                  {buttonText}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }
);

const GlucoseMonitorApp: React.FC = () => {
  const [glucoseData, setGlucoseData] = useState<GlucoseData[]>([]);
  const [eventData, setEventData] = useState<Event[]>([]);
  const [interestingEvents, setInterestingEvents] = useState<EventData | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<
    'dashboard' | 'explore' | 'predict',
    'upload'
  >('dashboard');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [glucoseResponse, eventsResponse, interestingEventsResponse] =
          await Promise.all([
            fetch('http://localhost:8000/glucose/'),
            fetch('http://localhost:8000/events/'),
            fetch('http://localhost:8000/interesting-events'),
          ]);

        const glucoseResult = await glucoseResponse.json();
        const eventsResult = await eventsResponse.json();
        const interestingEventsResult = await interestingEventsResponse.json();

        console.log(`interestingEventsResult: `, interestingEventsResult);
        setGlucoseData(glucoseResult);
        setEventData(eventsResult);
        setInterestingEvents(interestingEventsResult);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const renderView = () => {
    switch (view) {
      case 'dashboard':
        return <Dashboard glucoseData={glucoseData} eventData={eventData} />;
      case 'explore':
        return (
          <Explore
            glucoseData={glucoseData}
            allEvents={eventData}
            interestingEvents={interestingEvents!}
          />
        );
      case 'predict':
        return <Understand />;
      case 'upload':
        return <PhotoCapture />;
      default:
        return null;
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="mx-auto p-4 flex flex-col items-center">
      <nav className="w-full mb-4">
        <ul className="flex justify-center space-x-4">
          <li>
            <button
              onClick={() => setView('dashboard')}
              className={`px-4 py-2 rounded ${
                view === 'dashboard'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              onClick={() => setView('explore')}
              className={`px-4 py-2 rounded ${
                view === 'explore'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Explore
            </button>
          </li>
          <li>
            <button
              onClick={() => setView('predict')}
              className={`px-4 py-2 rounded ${
                view === 'predict'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Predict
            </button>
          </li>
          <li>
            <button
              onClick={() => setView('upload')}
              className={`px-4 py-2 rounded ${
                view === 'upload'
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-200 text-gray-800'
              }`}
            >
              Upload
            </button>
          </li>
        </ul>
      </nav>
      {renderView()}
      <div>
        <CopilotPopup
          labels={{
            title: 'Your Assistant',
            initial: 'Hi! 👋 How can I assist you today?',
          }}
        />
      </div>
    </div>
  );
};

export default React.memo(GlucoseMonitorApp);
