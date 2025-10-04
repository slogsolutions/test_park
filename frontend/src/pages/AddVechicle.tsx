// src/components/vehicles/AddVehicle.tsx
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
  registrationDate: string; // ISO date string
}

const initialVehicleDetails: VehicleDetails = {
  make: '',
  model: '',
  year: '',
  licensePlate: '',
  chassisNumber: '',
  registrationDate: '',
};

const API_BASE = import.meta.env.VITE_BASE_URL ?? '';

const AddVehicle: React.FC = () => {
  const [step, setStep] = useState<number>(1);
  const [rcNumber, setRcNumber] = useState<string>('');
  const [vehicleDetails, setVehicleDetails] = useState<VehicleDetails>(initialVehicleDetails);
  const [message, setMessage] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const totalSteps = 2;
  const navigate = useNavigate();

  const progress = (step / totalSteps) * 100;

  const goToStep = (stepNumber: number) => {
    setMessage('');
    setError('');
    setStep(stepNumber);
  };

  // ---------------- Step 1: Validate RC ----------------
  const handleRcSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    if (!rcNumber.trim()) {
      setError('RC number is required.');
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      const response = await axios.post(
        `${API_BASE}/api/vehicles/validate-rc`,
        {
          document_type: 'RC',
          reference_id: '0000-0000-0000-2005',
          consent_purpose: 'For bank account purpose only',
          id_number: rcNumber.trim(),
          consent: 'Y',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data?.kycStatus === 'SUCCESS') {
        const fetchedDetails = response.data.kycResult || {};
        setVehicleDetails({
          make: fetchedDetails.maker || '',
          model: fetchedDetails.class || '',
          year: fetchedDetails.registrationDate
            ? new Date(fetchedDetails.registrationDate).getFullYear().toString()
            : '',
          licensePlate: fetchedDetails.registrationNumber || '',
          chassisNumber: fetchedDetails.chassisNumber || '',
          registrationDate: fetchedDetails.registrationDate || '',
        });
        goToStep(2);
      } else {
        setError('Failed to fetch vehicle details. Please try again.');
      }
    } catch (err) {
      console.error('Error fetching RC details:', err);
      setError('Failed to fetch vehicle details. Please check your RC number and try again.');
    } finally {
      setLoading(false);
    }
  };

  // ---------------- Step 2: Add / Update Vehicle ----------------
  const handleChange = (name: keyof VehicleDetails, value: string) => {
    setVehicleDetails((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    setError('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        setError('User is not authenticated. Please log in again.');
        setLoading(false);
        return;
      }

      const formattedVehicleDetails = {
        ...vehicleDetails,
        year: Number(vehicleDetails.year),
      };

      const response = await axios.post(`${API_BASE}/api/vehicles/add`, formattedVehicleDetails, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.data) {
        setMessage('Vehicle added successfully!');
        setVehicleDetails(initialVehicleDetails);
        setRcNumber('');
        goToStep(1);
        toast.success('Your vehicle is registered. You can now book parking!');
        navigate('/bookings'); // optional: redirect to bookings
      } else {
        setError('Failed to add vehicle. Please try again.');
      }
    } catch (err) {
      console.error('Error adding vehicle:', err);
      setError('Failed to add vehicle. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderInputForKey = (key: keyof VehicleDetails) => {
    const label = key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase());

    if (key === 'registrationDate') {
      const value = vehicleDetails.registrationDate
        ? new Date(vehicleDetails.registrationDate).toISOString().slice(0, 10)
        : '';
      return (
        <div key={key} className="mb-4">
          <label className="block text-gray-700 font-medium">{label}:</label>
          <input
            type="date"
            value={value}
            onChange={(e) => handleChange(key, e.target.value)}
            required
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      );
    }

    if (key === 'year') {
      return (
        <div key={key} className="mb-4">
          <label className="block text-gray-700 font-medium">{label}:</label>
          <input
            type="number"
            min={1900}
            max={2100}
            value={vehicleDetails.year}
            onChange={(e) => handleChange(key, e.target.value)}
            required
            className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
          />
        </div>
      );
    }

    return (
      <div key={key} className="mb-4">
        <label className="block text-gray-700 font-medium">{label}:</label>
        <input
          type="text"
          value={vehicleDetails[key] as string}
          onChange={(e) => handleChange(key, e.target.value)}
          required
          className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen p-6">
      {step === 2 && (
        <button
          type="button"
          onClick={() => goToStep(1)}
          className="flex items-center mb-6 text-gray-700 hover:text-black"
        >
          <ArrowLeft className="mr-2" /> Back
        </button>
      )}

      {/* Progress bar */}
      <div className="mb-4">
        <div className="text-center text-gray-600">
          <h3 className="text-xl font-semibold">
            Step {step} of {totalSteps}
          </h3>
        </div>
        <div className="w-full bg-red-200 rounded-full h-2">
          <div className="bg-red-500 h-2 rounded-full" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {step === 1 && (
        <>
          <h2 className="text-2xl font-bold mb-4">Enter RC Number</h2>
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <form onSubmit={handleRcSubmit}>
            <div className="mb-4">
              <label className="block text-gray-700 font-medium">RC Number:</label>
              <input
                type="text"
                value={rcNumber}
                onChange={(e) => setRcNumber(e.target.value)}
                required
                disabled={loading}
                className="w-full px-4 py-2 border rounded focus:outline-none focus:ring-2 focus:ring-red-500"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Fetching...' : 'Fetch Details'}
            </button>
          </form>
        </>
      )}

      {step === 2 && (
        <>
          <h2 className="text-2xl font-bold mb-4">Update Vehicle Details</h2>
          {message && <p className="text-green-500 mb-2">{message}</p>}
          {error && <p className="text-red-500 mb-2">{error}</p>}
          <form onSubmit={handleSubmit}>
            {(['make', 'model', 'year', 'licensePlate', 'chassisNumber', 'registrationDate'] as (keyof VehicleDetails)[]).map(
              (k) => renderInputForKey(k)
            )}
            <button
              type="submit"
              disabled={loading}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition disabled:opacity-50"
            >
              {loading ? 'Submitting...' : 'Add Vehicle'}
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default AddVehicle;
