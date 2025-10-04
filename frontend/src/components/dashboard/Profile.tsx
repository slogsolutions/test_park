// src/components/dashboard/Profile.tsx
import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { io } from "socket.io-client";
import ProviderLocations from "./ProviderSpaces";
import BookedSlots from "./BookedSlot";
import LoadingScreen from "../../pages/LoadingScreen";
import { Wallet } from "./Wallet";
import { Settings } from "./Settings";
import type { Booking, Provider, ParkingSpace } from "../../types";
import { useRole } from "../../context/RoleContext";
import { useAuth } from "../../context/AuthContext";

export function Profile() {
  const [currentPage, setCurrentPage] = useState<"ProviderLocations" | "Settings" | "BookedSlots" | "Wallet" | "BuyerBookings">("ProviderLocations");
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Provider | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [spaces, setSpaces] = useState<ParkingSpace[]>([]);
  const [darkMode, setDarkMode] = useState(() => JSON.parse(localStorage.getItem("darkMode") || "false"));
  const { role: uiRole } = useRole();
  const auth = useAuth();
  const API_BASE_URL = import.meta.env.VITE_BASE_URL;

  const [stats, setStats] = useState<{
    buyerBookingsCount?: number;
    providerBookingsCount?: number;
    spacesCount?: number;
    earnings?: number;
  } | null>(null);

  useEffect(() => {
    let isMounted = true;
    const socket = io(API_BASE_URL);

    const fetchData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem("token");
        const headers = { Authorization: `Bearer ${token}` };

        if (auth?.user) setUser(auth.user as Provider);

        // Fetch fresh profile
        const profileRes = await axios.get(`${API_BASE_URL}/api/auth/me`, { headers });
        if (!isMounted) return;
        const profileData = profileRes.data;
        setUser(profileData);

        // Fetch aggregated stats
        try {
          const statsRes = await axios.get(`${API_BASE_URL}/api/stats/me`, { headers });
          if (!isMounted) return;
          if (statsRes.status === 200) setStats(statsRes.data);
        } catch (err) {
          console.warn("Failed to fetch stats:", err);
        }

        const profileIndicatesSeller =
          profileData?.role === "seller" ||
          profileData?.isSeller === true ||
          profileData?.seller === true ||
          profileData?.type === "seller";

        const isSeller = uiRole === "seller" ? true : profileIndicatesSeller;

        if (!isSeller) {
          setCurrentPage("BuyerBookings");
        } else {
          setCurrentPage((cur) => (cur === "BuyerBookings" ? "ProviderLocations" : cur));
        }

        // Fetch bookings based on role
        if (isSeller) {
          try {
            const bookingsRes = await axios.get(`${API_BASE_URL}/api/bookings/provider-bookings`, { headers });
            if (!isMounted) return;
            setBookings(bookingsRes.data || []);
          } catch (err) {
            console.warn("provider-bookings request failed:", err);
            setBookings([]);
          }

          // Fetch spaces for provider dashboard
          try {
            const spacesRes = await axios.get(`${API_BASE_URL}/api/parkings`, { headers });
            if (!isMounted) return;
            setSpaces(spacesRes.data || []);
          } catch (err) {
            console.warn("fetch spaces failed:", err);
            setSpaces([]);
          }
        } else {
          try {
            const bookingsRes = await axios.get(`${API_BASE_URL}/api/bookings/my-bookings`, { headers });
            if (!isMounted) return;
            setBookings(bookingsRes.data || []);
          } catch (err) {
            console.warn("user-bookings request failed:", err);
            setBookings([]);
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setBookings([]);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchData();

    // Socket.IO real-time updates
    socket.on("booking-updated", (data: any) => {
      setBookings((prev) => prev.map((b) => (b._id === data.booking._id ? data.booking : b)));
    });

    socket.on("parking-updated", (data: any) => {
      setSpaces((prev) => prev.map((s) => (s._id === data.parkingId ? { ...s, availableSpots: data.availableSpots } : s)));
    });

    return () => {
      isMounted = false;
      socket.disconnect();
    };
  }, [API_BASE_URL, uiRole, auth]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <LoadingScreen />
      </div>
    );
  }

  const isSeller = useMemo(() => {
    if (uiRole === "seller") return true;
    if (uiRole === "buyer") return false;
    if (!user) return false;
    return (
      user.role === "seller" ||
      (user as any).isSeller === true ||
      (user as any).seller === true ||
      (user as any).type === "seller"
    );
  }, [uiRole, user]);

  const kycRaw = useMemo(() => {
    if (!user) return "";
    const raw =
      (user as any).kycStatus ||
      (user as any).kycData?.status ||
      ((user as any).kycData?.verified ? "approved" : "") ||
      "";
    return raw.toString().toLowerCase();
  }, [user]);

  const kycDisplay = useMemo(() => {
    if (kycRaw === "approved" || kycRaw === "verified" || kycRaw === "done") {
      return { text: "verified", className: "text-green-600" };
    }
    if (kycRaw === "pending") {
      return { text: "pending", className: "text-yellow-600" };
    }
    return { text: "not done", className: "text-gray-500" };
  }, [kycRaw]);

  // SELLER DASHBOARD
  if (isSeller) {
    return (
      <div className="mx-5 mb-52 my-5 min-h-screen bg-gray-100">
        <div className="flex space-x-4 mb-6">
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${currentPage === "ProviderLocations" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() => setCurrentPage("ProviderLocations")}
          >
            Provider Locations
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${currentPage === "BookedSlots" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() => setCurrentPage("BookedSlots")}
          >
            Booked Slots
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${currentPage === "Wallet" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() => setCurrentPage("Wallet")}
          >
            Wallet
          </button>
          <button
            className={`px-4 py-2 rounded-lg font-semibold transition ${currentPage === "Settings" ? "bg-red-600 text-white" : "bg-gray-200 text-gray-700 hover:bg-gray-300"}`}
            onClick={() => setCurrentPage("Settings")}
          >
            Settings
          </button>
        </div>

        <div className="mt-6">
          {currentPage === "ProviderLocations" && <ProviderLocations spaces={spaces} />}
          {currentPage === "BookedSlots" && <BookedSlots bookings={bookings} />}
          {currentPage === "Wallet" && <Wallet bookings={bookings} />}
          {currentPage === "Settings" && <Settings />}
        </div>
      </div>
    );
  }

  // BUYER DASHBOARD
  const buyerBookingsCount = stats?.buyerBookingsCount ?? bookings?.length ?? 0;
  const buyerSpacesCount = stats?.spacesCount ?? 0;

  return (
    <div className="mx-5 mb-52 my-5 min-h-screen bg-gray-100">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-2xl shadow">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{user?.name || "Your profile"}</h2>
            <p className="text-sm text-gray-500">{user?.email}</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-3 gap-4 text-center">
          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xl font-semibold">{kycDisplay.text}</div>
            <div className="text-xs text-gray-500">KYC status</div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xl font-semibold">{buyerBookingsCount}</div>
            <div className="text-xs text-gray-500">Total Bookings</div>
          </div>

          <div className="p-4 bg-gray-50 rounded">
            <div className="text-xl font-semibold">{buyerSpacesCount > 0 ? buyerSpacesCount : "—"}</div>
            <div className="text-xs text-gray-500">Spaces (buyer)</div>
          </div>
        </div>

        <div className="mt-6">
          <h3 className="text-lg font-medium">Your Bookings</h3>
          {bookings?.length ? (
            <div className="grid gap-3 mt-4">
              {bookings.map((b: any) => (
                <div key={b._id || b.id} className="p-4 border rounded bg-white">
                  <div className="flex justify-between">
                    <div>
                      <div className="font-semibold">{b.spaceName || b.parkingName || b.title || "Booking"}</div>
                      <div className="text-xs text-gray-500">{b.startTime ? new Date(b.startTime).toLocaleString() : b.date || b.from || b.createdAt}</div>
                      {b.vehicleNumber && <div className="text-xs text-gray-500">{b.vehicleNumber}</div>}
                    </div>
                    <div className="text-sm text-gray-600">{b.status || "-"}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-4 text-sm text-gray-500">You have no bookings yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
