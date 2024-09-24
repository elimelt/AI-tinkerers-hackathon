import React, { useState, useMemo, useEffect } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';
import EventSelection from './EventSelection';
// import { CopilotChat } from '@copilotkit/react-ui';

interface GlucoseData {
  timestamp: string; // ISO format timestamp
  event_type: string; // Type of event (e.g., 'glucose')
  glucose_value: number; // Blood sugar value
}

interface FoodData {
  fat?: number;
  iron?: number;
  sodium?: number;
  sugars?: number;
  calcium?: number;
  protein?: number;
  calories?: number;
  transFat?: number;
  vitaminD?: number;
  potassium?: number;
  addedSugars?: number;
  cholesterol?: number;
  carbohydrate?: number;
  dietaryFiber?: number;
  saturatedFat?: number;
  sugar?: number; // Optional for food items
  monounsaturatedFat?: number; // Optional for food items
  polyunsaturatedFat?: number; // Optional for food items
}

interface InsulinData {
  units: number; // Required for insulin events
}

interface ExerciseData {
  calories: number; // Required for exercise events
  distance?: number; // Optional for exercise events
  duration: number; // Required for exercise events
}

interface EventData {
  data: FoodData | InsulinData | ExerciseData; // Nested object for event-specific data
  description: string | null; // Description can be null
}

interface Event {
  id: number;
  type: 'insulin' | 'food' | 'exercise'; // Define possible event types
  timestamp: string; // ISO format timestamp
  data: EventData['data']; // Use the data type from EventData
  description: string | null; // Description can be null
}

const Dashboard = () => {
  const [timeRange, setTimeRange] = useState(24);
  const [glucoseData, setGlucoseData] = useState<GlucoseData[]>([]);
  const [eventData, setEventData] = useState<Event[]>([]);
  const [filterType, setFilterType] = useState<
    'insulin' | 'food' | 'exercise' | 'all'
  >('all'); // State for filter type

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGlucoseData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/glucose/'); // Fetch data from the API
        const result = await response.json(); // Parse JSON response
        setGlucoseData(result); // Set the fetched data
      } catch (error) {
        console.error('Error fetching glucose data:', error); // Log any errors
      } finally {
        setLoading(false); // Ensure loading is set to false
      }
    };

    fetchGlucoseData();
  }, []); // Empty dependency array to run once on mount

  useEffect(() => {
    const fetchEventsData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:8000/events/'); // Fetch data from the API
        const result = await response.json(); // Parse JSON response
        console.log(`result: `, result);
        setEventData(result); // Set the fetched data
      } catch (error) {
        console.error('Error fetching events data:', error); // Log any errors
      } finally {
        setLoading(false); // Ensure loading is set to false
      }
    };

    fetchEventsData();
  }, []); // Empty dependency array to run once on mount

  const filteredData = useMemo(() => {
    if (loading) return [];

    const now = new Date();
    const cutoff = new Date(now.getTime() - timeRange * 60 * 60 * 1000);
    return glucoseData
      .filter(
        (item) => new Date(item.timestamp) > cutoff // Use timestamp from mockData
      )
      .map((item) => ({
        date: item.timestamp.split('T')[0], // Extract date
        time: item.timestamp.split('T')[1], // Extract time
        bloodSugar: item.glucose_value, // Use glucose_value for blood sugar
        type: 'Glucose', // Set a static type for display
        description: 'Glucose measurement', // Set a static description for display
      }));
  }, [glucoseData, loading, timeRange]); // Ensure timeRange is in the dependency array

  const filteredEventData = useMemo(() => {
    if (filterType === 'all') return eventData; // Show all events
    return eventData.filter((event) => event.type === filterType); // Filter by selected type
  }, [eventData, filterType]);

  const timeRangeButtons = [
    { label: '1 hr', value: 1 },
    { label: '3 hr', value: 3 },
    { label: '6 hr', value: 6 },
    { label: '12 hr', value: 12 },
    { label: '24 hr', value: 24 },
  ];

  return (
    <div className="mx-auto p-4 bg-gray-100">
      <h2 className="text-2xl font-bold mb-4">Dashboard</h2>

      <div className="flex flex-col md:flex-row">
        {' '}
        {/* Use flex-col for small screens and flex-row for medium and up */}
        <div className="flex-1 mb-4 md:mb-0">
          {' '}
          {/* Flex-grow for left side */}
          <div className="p-4 rounded-lg shadow mb-4">
            <div className="flex justify-between mb-2">
              {timeRangeButtons.map((button) => (
                <button
                  key={button.value}
                  onClick={() => setTimeRange(button.value)} // Ensure this is correctly set
                  className={`px-2 py-1 rounded ${
                    timeRange === button.value
                      ? 'bg-blue-500 text-white'
                      : 'text-blue-500'
                  }`}
                >
                  {button.label}
                </button>
              ))}
            </div>

            <h3 className="text-lg font-semibold mb-2 text-left">
              Blood Sugar
            </h3>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={filteredData}>
                <XAxis dataKey="time" />
                <YAxis domain={[0, 300]} />
                <Tooltip />
                <ReferenceLine y={250} stroke="#ffd700" strokeDasharray="3 3" />
                <ReferenceLine y={70} stroke="#ff0000" strokeDasharray="3 3" />
                <Line
                  type="monotone"
                  dataKey="bloodSugar"
                  stroke="#3b82f6"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <h3 className="font-semibold mb-2">Events</h3>
            <div className="overflow-x-auto">
              {/* Filter Dropdown Container */}
              <div className="flex justify-end mb-4">
                {' '}
                {/* Added flex and justify-end */}
                <label htmlFor="eventType" className="mr-2">
                  Filter by Type:
                </label>
                <select
                  id="eventType"
                  value={filterType}
                  onChange={(e) =>
                    setFilterType(
                      e.target.value as 'insulin' | 'food' | 'exercise' | 'all'
                    )
                  }
                  className="border rounded p-1"
                >
                  <option value="all">All</option>
                  <option value="insulin">Insulin</option>
                  <option value="food">Food</option>
                  <option value="exercise">Exercise</option>
                </select>
              </div>
              <table className="min-w-full table-fixed">
                {' '}
                {/* Use table-fixed for fixed layout */}
                <thead>
                  <tr className="bg-gray-100">
                    <th className="py-2 px-4 text-left w-1/4">Date</th>{' '}
                    {/* Set width for Date column */}
                    <th className="py-2 px-4 text-left w-1/4">Time</th>{' '}
                    {/* Set width for Time column */}
                    <th className="py-2 px-4 text-left w-1/4">Type</th>{' '}
                    {/* Set width for Type column */}
                    <th className="py-2 px-4 text-left w-1/4">
                      Description
                    </th>{' '}
                    {/* Set width for Description column */}
                  </tr>
                </thead>
                <tbody>
                  {filteredEventData.map((event, index) => (
                    <tr
                      key={index}
                      className={index % 2 === 0 ? 'bg-gray-50' : 'bg-white'}
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
        <div className="flex-none w-full md:w-1/2 mx-4 mt-0">
          {/* Full width on small screens, half on medium and up */}
          <iframe
            src="https://gpt4o.so/tools/i/healthy-chef-ZxWya7Xx"
            width="100%" // Make iframe responsive
            height="700"
            style={{ maxWidth: '100%' }}
            title="Healthy Chef Tool"
          ></iframe>
          {/* TODO: replace with CopilotKit */}
          {/* <CopilotChat
            labels={{
              title: 'Your Assistant',
              initial: 'Hi! 👋 How can I assist you today?',
            }}
          />*/}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
