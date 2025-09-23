import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css'; 
import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface VehicleDetails {
  make: string;
  model: string;
  year: string;
  licensePlate: string;
  chassisNumber: string;
  registrationDate: string;
}

const AddVehicle: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [rcNumber, setRcNumber] = useState<string>('');
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>({
    make: '',
    model: '',
    year: '',
    licensePlate: '',
    chassisNumber: '',
    registrationDate: '',
  });
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const totalSteps = 2;
  const navigate=useNavigate()

  const progress = (step / totalSteps) * 100;

  const handleRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!rcNumber.trim()) {
      setError('RC number is required.');
      return;
    }

    try {
      const response = await axios.post( `${import.meta.env.VITE_BASE_URL}/proxy/validate-RC`, {
        document_type: 'RC',
        reference_id: '0000-0000-0000-2005',
        consent_purpose: 'For bank account purpose only',
        id_number: rcNumber.trim(),
        consent: 'Y',
      });

      if (response.data?.kycStatus === 'SUCCESS') {
        const fetchedDetails = response.data.kycResult;
        setVehicleDetails({
          make: fetchedDetails.maker || '',
          model: fetchedDetails.class || '',
          year: new Date(fetchedDetails.registrationDate).getFullYear().toString() || '',
          licensePlate: fetchedDetails.registrationNumber || '',
          chassisNumber: fetchedDetails.chassisNumber || '',
          registrationDate: fetchedDetails.registrationDate || '',
        });
        setStep(2);
      } else {
        setError('Failed to fetch vehicle details. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching RC details:', err);
      setError('Failed to fetch vehicle details. Please check your RC number and try again.');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setVehicleDetails({ ...vehicleDetails, [name]: value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated. Please log in again.');
        return;
      }

      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/booking/add-vehicle`,
        vehicleDetails,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data) {
        setMessage('Vehicle added successfully!');
        setVehicleDetails({
          make: '',
          model: '',
          year: '',
          licensePlate: '',
          chassisNumber: '',
          registrationDate: '',
        });
        setStep(1);
        setRcNumber('');
        toast.success('Your vehicle is registered now. Enjoy your booking!');
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setError('Failed to add vehicle. Please try again.');
    }
  };

  return (
    <div className="min-h-screen  p-6">
          <button onClick={() => navigate(-1)} className="flex items-center mb-6 text-gray-700 hover:text-black">
        <ArrowLeft className="mr-2" /> Back
      </button>
      {/* Progress bar */}
      <div className="mb-4">
        <div className="text-center text-gray-600">
          <h3 className="text-xl font-semibold">Step {step} of {totalSteps}</h3>
        </div>
        <div className="w-full bg-red-200 rounded-full h-2">
          <div
            className="bg-red-500 h-2 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {step === 1 && (
        <>
          <h2 className="text-2xl font-bold mb-4">Enter RC Number</h2>
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleRcSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium">RC Number:</label>
              <input
                type="text"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                required
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Fetch Details
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-2xl font-bold mb-4">Update Vehicle Details</h2>
          {message && <p className="text-green-500">{message}</p>}
          {error && <p className="text-red-500">{error}</p>}
          <form onSubmit={handleSubmit}>
            {Object.keys(vehicleDetails).map((key) => (
              <div key={key} className="mb-4">
                <label className="block text-gray-700 font-medium">
                  {key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}:
                </label>
                <input
                  type={
                    key === 'year'
                      ? 'number'
                      : key === 'registrationDate'
                      ? 'date'
                      : 'text'
                  }
                  name={key}
                  value={
                    key === 'registrationDate'
                      ? vehicleDetails[key]
                        ? new Date(vehicleDetails[key]).toISOString().slice(0, 10)
                        : ''
                      : vehicleDetails[key]
                  }
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
                />
              </div>
            ))}
            <button
              type="submit"
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Add Vehicle
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AddVehicle;
