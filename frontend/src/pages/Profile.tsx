import { useState, useEffect } from "react";
import { LogOut, User, MapPin, FileCheck, Home, Phone, Mail } from "lucide-react";
import Loader from "./LoadingScreen";

interface UserProfile {
  name: string;
  email: string;
  avatar?: string;
  bio?: string;
  kycData?: {
    address: string;
    city: string;
    country: string;
    fullName: string;
    phoneNumber: string;
    zipCode: string;
  };
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchProfile() {
      try {
        const token = localStorage.getItem("token");
        const response = await fetch(`${import.meta.env.VITE_BASE_URL}/api/auth/me`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error("Failed to fetch profile");
        }
        const data = await response.json();
        setProfile(data);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setIsLoading(false);
      }
    }
    fetchProfile();
  }, []);

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader />
      </div>
    );
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  if (!profile) {
    return <div className="p-4 text-center">No profile data available</div>;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gray-100">
      <div className="w-full max-w-lg p-6 sm:p-8 bg-white shadow-lg rounded-2xl border border-gray-200 flex flex-col items-center">
        <div className="flex flex-col items-center text-center">
          <div className="flex justify-center mb-4">
            <div className="bg-red-100 p-4 rounded-full shadow-md">
              <User className="w-12 h-12 text-red-600" />
            </div>
          </div>
          <h2 className="mt-4 text-2xl font-bold text-gray-900">{profile.name}</h2>
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Mail className="w-4 h-4 text-gray-500" /> {profile.email}
          </p>
        </div>

        {profile.kycData && (
          <div className="mt-6 p-4 sm:p-6 bg-gray-100 rounded-xl shadow-inner w-full">
            <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
              <FileCheck className="w-5 h-5 text-green-600" /> KYC Details
            </h3>
            <p className="mt-2 text-gray-600 flex items-center gap-2">
              <User className="w-4 h-4 text-gray-500" /> {profile.kycData.fullName}
            </p>
            <p className="mt-2 text-gray-600 flex items-center gap-2">
              <Phone className="w-4 h-4 text-gray-500" /> {profile.kycData.phoneNumber}
            </p>
            <p className="mt-2 text-gray-600 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-gray-500" /> {profile.kycData.address}, {profile.kycData.city}, {profile.kycData.country}
            </p>
            <p className="mt-2 text-gray-600 flex items-center gap-2">
              <Home className="w-4 h-4 text-gray-500" /> Zip Code: {profile.kycData.zipCode}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
