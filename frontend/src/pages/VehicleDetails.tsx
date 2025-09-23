import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Bike, Car, PlusCircle } from 'lucide-react'; // Using Lucid Icons
import LoadingScreen from './LoadingScreen';
import DatePicker from 'react-datepicker';
import { FaMotorcycle } from 'react-icons/fa';

export default function VehicleDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<any>(null);
  const [availability, setAvailability] = useState<any[]>([]); // To store available time slots
  const [selectedSlot, setSelectedSlot] = useState<any>(null); // Store the selected slot as an object

  const { spaceId, userId } = location.state || {}; // Safely access passed state
  const [manualStartTime, setManualStartTime] = useState<Date | null>(null);
  const [manualEndTime, setManualEndTime] = useState<Date | null>(null);
  useEffect(() => {
    const fetchVehicles = async () => {
      try {
    setLoading(true);

        const token = localStorage.getItem('token');
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/data/vehicles`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch vehicles');
        }

        const data = await response.json();
        setVehicles(data);
      } catch (error) {
        console.error(error);
      }finally{
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  useEffect(() => {
    const fetchAvailability = async () => {
      if (spaceId) {
        try {
          const token = localStorage.getItem('token');
          const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/parking/availability/${spaceId}`, {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          });
    
          if (!response.ok) {
            throw new Error('Failed to fetch parking availability');
          }
    
          const data = await response.json();
    
          // Check if availability exists
          if (data && data.availability && Array.isArray(data.availability)) {
            // Format the slots as objects with startTime and endTime
            const formattedAvailability = data.availability
              .filter((slot) => !slot.isBooked) // Filter out booked slots
              .map((slot) => ({
                startTime: new Date(slot.startTime),
                endTime: new Date(slot.endTime),
                display: `${new Date(slot.startTime).toLocaleString()} - ${new Date(slot.endTime).toLocaleString()}`,
              }));
            setAvailability(formattedAvailability);
          } else {
            console.error('No valid availability data received');
            alert('No availability data found');
          }
        } catch (error) {
          console.error('Error fetching parking space availability:', error);
          alert('An error occurred while fetching availability');
        }
      }
    };
    
    fetchAvailability();
  }, [spaceId]);
  
  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);

  try {
    // Basic validations
    if (!spaceId) {
      alert('No parking space info — go back and try again.');
      return;
    }
    if (!userId) {
      alert('No user info — log in and try again.');
      return;
    }
    if (!selectedVehicle) {
      alert('Please select a vehicle from the list.');
      return;
    }
    if (!manualStartTime || !manualEndTime) {
      alert('Please select both start and end times.');
      return;
    }
    if (manualEndTime <= manualStartTime) {
      alert('End time must be after start time.');
      return;
    }

    const payload = {
      parkingSpaceId: spaceId,
      userId,
      startTime: manualStartTime.toISOString(),
      endTime: manualEndTime.toISOString(),
      vehicleNumber: selectedVehicle.licensePlate,
      vehicleType: selectedVehicle.vehicleType ?? selectedVehicle.model,
      vehicleModel: selectedVehicle.model,
      contactNumber: selectedVehicle.contactNumber,
      chassisNumber: selectedVehicle.chassisNumber,
    };

    console.log('POST /api/booking payload:', payload);

    const url = `${import.meta.env.VITE_BASE_URL}/api/booking`; // no trailing slash
    console.log('Posting to:', url);

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${localStorage.getItem('token')}`,
      },
      body: JSON.stringify(payload),
    });

    const text = await response.text();
    let data;
    try { data = JSON.parse(text); } catch { data = { message: text }; }

    console.log('Booking response status:', response.status, 'body:', data);

    if (!response.ok) {
      alert(`Error: ${data.message || response.statusText}`);
      return;
    }

    alert('Booking confirmed!');
    navigate('/bookings', { state: { referenceId: data.booking?._id ?? data.referenceId } });
  } catch (err) {
    console.error('Error submitting booking:', err);
    alert('An error occurred. Try again.');
  } finally {
    setLoading(false);
  }
};

  
  

  const handleCardClick = (vehicle: any) => {
    setSelectedVehicle(vehicle);
  };

  const handleAddVehicleClick = () => {
    navigate('/add-vechile'); // Navigate to the Add Vehicle page
  };
  
  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
       <LoadingScreen/>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6">
          <button onClick={() => navigate(-1)} className="flex items-center mb-6 text-gray-700 hover:text-black">
        <ArrowLeft className="mr-2" /> Back
      </button>
      {!selectedVehicle ? (
        <>
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">Your Registered Vehicles</h2>
          {vehicles.length === 0 ? (
            <p className="text-center text-gray-500">No vehicles found.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {vehicles.map((vehicle) => {
              console.log(vehicle.model);
              
              // Determine the icon based on vehicle type
              const Icon = vehicle.model === "M-Cycle/Scooter(2WN)" ? Bike : Car;
      
              return (
                <div
                  key={vehicle.licensePlate}
                  className="border border-gray-300 p-6 rounded-xl shadow-md hover:shadow-lg transition-all transform hover:scale-105 cursor-pointer"
                  onClick={() => handleCardClick(vehicle)}
                >
                          <div className="flex justify-center mb-4">
              <div className="bg-red-100 p-4 rounded-full shadow-md">
                <Icon className="w-12 h-12 text-red-600" />
              </div>
            </div>
                  <div className="flex items-center gap-3 mb-3">
                    <h4 className="text-xl font-semibold text-gray-900">
                      {vehicle.make} {vehicle.model}
                    </h4>
                  </div>
                  <p className="text-gray-700"><strong>Year:</strong> {vehicle.year}</p>
                  <p className="text-gray-700"><strong>License Plate:</strong> {vehicle.licensePlate}</p>
                  <p className="text-gray-700"><strong>Chassis Number:</strong> {vehicle.chassisNumber}</p>
                  <p className="text-gray-700">
                    <strong>Registration Date:</strong> {new Date(vehicle.registrationDate).toLocaleDateString()}
                  </p>
                </div>
              );
            })}
          </div>
          )}

          <div className="mt-8 flex justify-center">
            <button
              onClick={handleAddVehicleClick}
              className="flex items-center bg-red-500 text-white py-2 px-4 rounded-md hover:bg-red-600 transition-all"
            >
              <PlusCircle size={18} className="mr-2" />
              Add New Vehicle
            </button>
          </div>
        </>
      ) : (
        <>
          <h2 className="text-lg font-bold text-gray-800 mb-4">Vehicle Details</h2>
          <form onSubmit={handleSubmit}>
            {/* Pre-filled Vehicle Details */}
            <label className="block text-sm font-medium text-red-700">
              Vehicle Number
              <input
                type="text"
                name="vehicleNumber"
                required
                defaultValue={selectedVehicle.licensePlate}
                className="mt-1 block w-full p-2 border border-red-200 rounded-md"
              />
            </label>

            {/* Vehicle Type */}
            <label className="block text-sm font-medium text-red-700 mt-4">
              Vehicle Type
              <select
                name="vehicleType"
                required
                defaultValue={selectedVehicle.vehicleType}
                className="mt-1 block w-full p-2 border border-red-200 rounded-md"
              >
                <option value="micro">Micro</option>
                <option value="mini">Mini</option>
                <option value="small">Small</option>
                <option value="midsize">Midsize</option>
                <option value="large">Large</option>
              </select>
            </label>

            {/* Vehicle Model */}
            <label className="block text-sm font-medium text-red-700 mt-4">
              Vehicle Model
              <input
                type="text"
                name="vehicleModel"
                required
                defaultValue={selectedVehicle.model}
                className="mt-1 block w-full p-2 border border-red-200 rounded-md"
              />
            </label>

            {/* Contact Number */}
            <label className="block text-sm font-medium text-red-700 mt-4">
              Contact Number
              <input
                type="tel"
                name="contactNumber"
                required
                defaultValue={selectedVehicle.contactNumber}
                className="mt-1 block w-full p-2 border border-red-200 rounded-md"
              />
            </label>

            {/* Chassis Number */}
            <label className="block text-sm font-medium text-red-700 mt-4">
              Chassis Number
              <input
                type="text"
                name="chassisNumber"
                required
                defaultValue={selectedVehicle.chassisNumber}
                className="mt-1 block w-full p-2 border border-red-200 rounded-md"
              />
            </label>

            {/* Select Time Slot */}
            <label className="block text-sm font-medium text-red-700 mt-4">
            <label className="block text-sm font-medium text-red-700 mt-4">
              Select Start Time
              <DatePicker
                selected={manualStartTime}
                onChange={(date) => setManualStartTime(date)}
                showTimeSelect
                timeFormat="HH:mm"
                timeIntervals={30}
                dateFormat="Pp"
                className="mt-1 block w-full p-2 border border-red-200 rounded-md"
              />
            </label>

              <label className="block text-sm font-medium text-red-700 mt-4">
                Select End Time
                <DatePicker
                  selected={manualEndTime}
                  onChange={(date) => setManualEndTime(date)}
                  showTimeSelect
                  timeFormat="HH:mm"
                  timeIntervals={30}
                  dateFormat="Pp"
                  minDate={manualStartTime} // Ensure end time is after start time
                  className="mt-1 block w-full p-2 border border-red-200 rounded-md"
                />
              </label>

              
            </label>

            <button
              type="submit"
              disabled={loading}
              className="mt-6 w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition"
            >
              {loading ? 'Processing...' : 'Confirm Booking'}
            </button>
          </form>
        </>
      )}
    </div>
  );
}


// import React, { useState, useEffect } from 'react';
// import { useLocation, useNavigate } from 'react-router-dom';
// import { PlusCircle, ArrowLeft, CheckCircle, Shield, Plug, Video } from 'lucide-react'; // Icons

// const amenitiesList = [
//   { id: 'covered', label: 'Covered Parking', icon: CheckCircle },
//   { id: 'security', label: 'Security', icon: Shield },
//   { id: 'charging', label: 'EV Charging', icon: Plug },
//   { id: 'cctv', label: 'CCTV Surveillance', icon: Video },
// ];

// export default function VehicleDetails() {
//   const location = useLocation();
//   const navigate = useNavigate();
//   const [loading, setLoading] = useState(false);
//   const [vehicles, setVehicles] = useState([]);
//   const [selectedVehicle, setSelectedVehicle] = useState(null);
//   const [availability, setAvailability] = useState([]);
//   const [selectedSlot, setSelectedSlot] = useState(null);

//   const { spaceId, userId } = location.state || {};

//   useEffect(() => {
//     const fetchVehicles = async () => {
//       try {
//         const token = localStorage.getItem('token');
//         const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/data/vehicles`, {
//           headers: { Authorization: `Bearer ${token}` },
//         });
//         if (!response.ok) throw new Error('Failed to fetch vehicles');
//         const data = await response.json();
//         setVehicles(data);
//       } catch (error) {
//         console.error(error);
//       }
//     };
//     fetchVehicles();
//   }, []);

//   useEffect(() => {
//     if (spaceId) {
//       const fetchAvailability = async () => {
//         try {
//           const token = localStorage.getItem('token');
//           const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/parking/availability/${spaceId}`, {
//             headers: { Authorization: `Bearer ${token}` },
//           });
//           if (!response.ok) throw new Error('Failed to fetch parking availability');
//           const data = await response.json();
//           if (data.availability && Array.isArray(data.availability)) {
//             const formattedAvailability = data.availability
//               .filter((slot) => !slot.isBooked)
//               .map((slot) => ({
//                 startTime: new Date(slot.startTime),
//                 endTime: new Date(slot.endTime),
//                 display: `${new Date(slot.startTime).toLocaleString()} - ${new Date(slot.endTime).toLocaleString()}`,
//               }));
//             setAvailability(formattedAvailability);
//           }
//         } catch (error) {
//           console.error('Error fetching availability:', error);
//         }
//       };
//       fetchAvailability();
//     }
//   }, [spaceId]);

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     const formData = new FormData(e.target);
//     formData.append('parkingSpaceId', spaceId);
//     formData.append('userId', userId);
//     if (selectedSlot) {
//       formData.append('startTime', selectedSlot.startTime.toISOString());
//       formData.append('endTime', selectedSlot.endTime.toISOString());
//     } else {
//       alert('Please select a valid time slot');
//       setLoading(false);
//       return;
//     }
//     try {
//       const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/booking/`, {
//         method: 'POST',
//         headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
//         body: formData,
//       });
//       if (!response.ok) throw new Error('Failed to book');
//       const data = await response.json();
//       alert(`Booking confirmed! Reference: ${data.referenceId}`);
//       navigate('/bookings', { state: { referenceId: data.referenceId } });
//     } catch (err) {
//       console.error(err);
//       alert('Error submitting booking');
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="min-h-screen bg-red-100 p-6">
//       <button onClick={() => navigate(-1)} className="flex items-center mb-6 text-gray-700 hover:text-black">
//         <ArrowLeft className="mr-2" /> Back
//       </button>
//       {!selectedVehicle ? (
//         <>
//           <h2 className="text-3xl font-bold text-center text-gray-800">Your Registered Vehicles</h2>
//           {vehicles.length === 0 ? (
//             <p className="text-center text-gray-500 mt-4">No vehicles found.</p>
//           ) : (
//             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-6">
//               {vehicles.map((vehicle) => (
//                 <div
//                   key={vehicle._id}
//                   className="bg-white p-6 rounded-lg shadow-md hover:shadow-lg cursor-pointer transform hover:scale-105 transition"
//                   onClick={() => setSelectedVehicle(vehicle)}
//                 >
//                   <h3 className="text-2xl font-semibold text-gray-800">{vehicle.make} {vehicle.model}</h3>
//                   <p className="text-gray-600">License Plate: {vehicle.licensePlate}</p>
//                 </div>
//               ))}
//             </div>
//           )}
//           <div className="flex justify-center mt-6">
//             <button
//               onClick={() => navigate('/add-vehicle')}
//               className="flex items-center bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition"
//             >
//               <PlusCircle size={18} className="mr-2" /> Add New Vehicle
//             </button>
//           </div>
//         </>
//       ) : (
//         <>
//           <h2 className="text-3xl font-bold text-gray-800">Vehicle Details</h2>
//           <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md mt-6">
//             <label className="block mb-4">
//               Vehicle Number
//               <input type="text" name="vehicleNumber" defaultValue={selectedVehicle.licensePlate} className="block w-full p-2 border rounded-md" required />
//             </label>
//             <label className="block mb-4">
//               Select Time Slot
//               <select
//                 name="timeSlot"
//                 required
//                 value={selectedSlot?.display || ''}
//                 onChange={(e) => setSelectedSlot(availability.find(slot => slot.display === e.target.value))}
//                 className="block w-full p-2 border rounded-md"
//               >
//                 <option value="" disabled>Select a time slot</option>
//                 {availability.map((slot, index) => (
//                   <option key={index} value={slot.display}>{slot.display}</option>
//                 ))}
//               </select>
//             </label>
//             <button type="submit" disabled={loading} className="w-full bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-red-600 transition">
//               {loading ? 'Processing...' : 'Confirm Booking'}
//             </button>
//           </form>
//         </>
//       )}
//     </div>
//   );
// }
