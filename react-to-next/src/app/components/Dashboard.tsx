// const Dashboard: React.FC<{
//   glucoseData: GlucoseData[];
//   eventData: Event[];
//   onAIClick: () => void;
// }> = React.memo(({ glucoseData, eventData, onAIClick }) => {
//   const [timeRange, setTimeRange] = useState(24);
//   const [filterType, setFilterType] = useState<string>('all');
//   // const [glucoseData, setGlucoseData] = useState<GlucoseData[]>([]);
//   const { addEvent, deleteEvent } = useEvents();
//   // const [loading, setLoading] = useState(true);
//   const [eventDescription, setEventDescription] = useState('');
//   const [eventType, setEventType] = useState<string>('');
//   const eventTypes = eventData.map((event) => event.type); // Extract event types
//   const uniqueEventTypes = Array.from(new Set(eventTypes)).sort(); // Remove duplicates and sort alphabetically

//   const filteredData = useMemo(() => {
//     const now = new Date();
//     const cutoff = new Date(now.getTime() - timeRange * 60 * 60 * 1000);
//     return glucoseData.filter((item) => new Date(item.timestamp) > cutoff);
//   }, [glucoseData, timeRange]);

//   const filteredEventData = useMemo(() => {
//     if (filterType === 'all') return eventData;
//     return eventData.filter((event) => event.type === filterType);
//   }, [eventData, filterType]);

//   const timeRangeButtons = useMemo(
//     () => [
//       { label: '1 hr', value: 1 },
//       { label: '3 hr', value: 3 },
//       { label: '6 hr', value: 6 },
//       { label: '12 hr', value: 12 },
//       { label: '24 hr', value: 24 },
//     ],
//     []
//   );

//   const handleTimeRangeChange = useCallback((value: number) => {
//     setTimeRange(value);
//   }, []);

//   const handleFilterTypeChange = useCallback(
//     (e: React.ChangeEvent<HTMLSelectElement>) => {
//       setFilterType(e.target.value);
//     },
//     []
//   );

//   const handleAddEvent = () => {
//     const newEvent = {
//       id: Date.now(),
//       type: eventType,
//       timestamp: new Date().toISOString(),
//       data: {},
//       description: eventDescription,
//     };
//     addEvent(newEvent);
//     setEventDescription('');
//     setEventType('');
//   };

//   // // Filter the events based on the selected type
//   // const filteredEventData =
//   //   filterType === 'all'
//   //     ? eventData
//   //     : eventData.filter((event) => event.type === filterType);

//   // Sort the filtered events by timestamp
//   const sortedEventData = filteredEventData.sort(
//     (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
//   );

//   return (
//     <div className="mx-auto p-4 flex flex-col items-center">
//       <h2 className="text-2xl font-bold mb-4">Dashboard</h2>
//       <div className="flex flex-col md:flex-row w-full">
//         <div className="flex-1 mb-4 md:mb-0">
//           <div className="p-4 rounded-lg shadow mb-4">
//             <div className="flex justify-between mb-2">
//               {timeRangeButtons.map((button) => (
//                 <button
//                   key={button.value}
//                   onClick={() => handleTimeRangeChange(button.value)}
//                   className={`px-2 py-1 rounded ${
//                     timeRange === button.value
//                       ? 'bg-blue-500 text-white'
//                       : 'text-blue-500'
//                   }`}
//                 >
//                   {button.label}
//                 </button>
//               ))}
//             </div>
//             <h3 className="text-lg font-semibold mb-2 text-left">
//               Blood Sugar
//             </h3>
//             <BloodSugarChart filteredData={filteredData} />
//           </div>
//           <div className=" p-4 rounded-lg shadow">
//             <button type="button" onClick={onAIClick}>
//               <FontAwesomeIcon
//                 icon={faLightbulb}
//                 className="ml-2 text-yellow-500"
//               />{' '}
//               Click me for AI
//             </button>
//             <h3 className="font-semibold mb-2">Events</h3>
//             <div className="flex items-center mb-4">
//               <input
//                 type="text"
//                 value={eventDescription}
//                 onChange={(e) => setEventDescription(e.target.value)}
//                 placeholder="Enter event description"
//                 className="border rounded p-2 mr-4 w-1/2"
//               />
//               <input
//                 type="text"
//                 value={eventType}
//                 onChange={(e) => setEventType(e.target.value)}
//                 placeholder="Enter event type (insulin, food, exercise)"
//                 className="border rounded p-2 mr-2 w-1/2 "
//               />
//             </div>
//             <button
//               onClick={handleAddEvent}
//               className="bg-blue-500 text-white rounded p-2 w-full mb-4"
//             >
//               Add Event
//             </button>
//             <div className="flex justify-end mb-4">
//               <label htmlFor="eventTypeFilter" className="mr-2">
//                 Filter by Type:
//               </label>
//               <select
//                 id="eventTypeFilter"
//                 value={filterType}
//                 onChange={(e) => setFilterType(e.target.value)}
//                 className="border rounded p-1 focus:outline-none"
//               >
//                 <option value="all">All</option>
//                 {uniqueEventTypes.map((type) => (
//                   <option key={type} value={type}>
//                     {type}
//                   </option>
//                 ))}
//               </select>
//             </div>
//             <div className="overflow-x-auto">
//               <table className="min-w-full table-fixed">
//                 <thead>
//                   <tr>
//                     <th className="py-2 px-4 text-left w-1/4">ID</th>
//                     <th className="py-2 px-4 text-left w-1/4">Date</th>
//                     <th className="py-2 px-4 text-left w-1/4">Time</th>
//                     <th className="py-2 px-4 text-left w-1/4">Type</th>
//                     <th className="py-2 px-4 text-left w-1/4">Description</th>
//                     <th className="py-2 px-4 text-left w-1/4">Actions</th>
//                   </tr>
//                 </thead>
//                 <tbody>
//                   {sortedEventData.map((event, index) => (
//                     <tr
//                       key={event.id}
//                       className={index % 2 === 0 ? 'bg-gray-100' : 'bg-white'}
//                     >
//                       <td className="py-2 px-4 text-left">{event.id}</td>
//                       <td className="py-2 px-4 text-left">
//                         {event.timestamp.split('T')[0]}
//                       </td>
//                       <td className="py-2 px-4 text-left">
//                         {event.timestamp.split('T')[1]}
//                       </td>
//                       <td className="py-2 px-4 text-left">{event.type}</td>
//                       <td className="py-2 px-4 text-left">
//                         {event.description || 'NA'}
//                       </td>
//                       <td className="py-2 px-4 text-left">
//                         <button
//                           onClick={() => deleteEvent(event.id)}
//                           className="text-red-500"
//                         >
//                           Delete
//                         </button>
//                       </td>
//                     </tr>
//                   ))}
//                 </tbody>
//               </table>
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// });
