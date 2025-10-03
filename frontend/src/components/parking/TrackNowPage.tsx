// frontend/src/pages/TrackNowPage.tsx
import React, { useEffect, useState, useRef } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { MdGpsFixed } from "react-icons/md";
import { FaParking } from "react-icons/fa";
import { useMapContext } from "../../context/MapContext";
import axios from "axios";

export default function TrackNowPage() {
  const { viewport, setViewport } = useMapContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [booking, setBooking] = useState<any>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const [routeData, setRouteData] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{ lat: number; lng: number } | null>(null);

  const [initialOtp, setInitialOtp] = useState<string | null>(null);
  const [initialOtpExpires, setInitialOtpExpires] = useState<string | null>(null);

  const intervalRef = useRef<number | null>(null);
  const pollRef = useRef<number | null>(null);

  // Accept both `otp` and `firstOtp` because different places might use either name
  const { bookingId, parkingSpace, otp: otpFromState, firstOtp: firstOtpFromState, expiresAt } = (location.state || {}) as any;
  const base = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    // initialize initial OTP values from navigation state (if present)
    if (otpFromState) setInitialOtp(String(otpFromState));
    else if (firstOtpFromState) setInitialOtp(String(firstOtpFromState));

    if (expiresAt) setInitialOtpExpires(String(expiresAt));
  }, [otpFromState, firstOtpFromState, expiresAt]);

  useEffect(() => {
    if (!bookingId) {
      toast.error("No booking selected");
      navigate(-1);
      return;
    }

    // Fetch user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setViewport({ ...viewport, latitude, longitude });

          if (parkingSpace) {
            const [destLng, destLat] = parkingSpace.location.coordinates;
            fetchRoute(latitude, longitude, destLat, destLng);
          }
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Could not get your location.");
        }
      );
    }

    const fetchBooking = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`${base}/api/booking/${bookingId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        // backend could return booking directly or { booking: ... }
        const respBooking = res.data?.booking || res.data;
        setBooking(respBooking);

        // If backend includes an OTP field for buyer (rare), keep it
        if (respBooking?.otp) {
          setInitialOtp(String(respBooking.otp));
          if (respBooking.otpExpires) setInitialOtpExpires(String(respBooking.otpExpires));
        }

        // If booking is completed, navigate away
        if (respBooking && respBooking.status === "completed") {
          toast.info("Booking session has completed.");
          navigate("/my-bookings");
        }
      } catch (err: any) {
        console.error("Failed to fetch booking", err);
        if (err.response?.status === 404) {
          toast.info("Booking session has ended");
          navigate("/my-bookings");
        }
      }
    };

    fetchBooking();
    // Poll booking every 3 seconds for status updates
    pollRef.current = window.setInterval(fetchBooking, 3000);

    return () => {
      if (pollRef.current) window.clearInterval(pollRef.current);
      if (intervalRef.current) window.clearInterval(intervalRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bookingId]);

  // Start countdown when sessionEndAt is available
  useEffect(() => {
    if (!booking || !booking.sessionEndAt) {
      setRemainingMs(null);
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
      return;
    }

    const updateRemaining = () => {
      const remaining = new Date(booking.sessionEndAt).getTime() - Date.now();
      setRemainingMs(remaining > 0 ? remaining : 0);
      if (remaining <= 0 && intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    updateRemaining();
    if (!intervalRef.current) {
      intervalRef.current = window.setInterval(updateRemaining, 1000);
    }

    return () => {
      if (intervalRef.current) {
        window.clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [booking?.sessionEndAt]);

  const fetchRoute = async (originLat: number, originLng: number, destLat: number, destLng: number) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}`,
        {
          params: {
            alternatives: false,
            geometries: "geojson",
            overview: "full",
            access_token: "pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A",
          },
        }
      );
      setRouteData(response.data.routes[0]);
    } catch (error) {
      console.error("Failed to fetch route:", error);
    }
  };

  const formatTime = (ms: number | null) => {
    if (ms === null || ms <= 0) return "00:00:00";
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${seconds
      .toString()
      .padStart(2, "0")}`;
  };

  // Determine which OTP to show:
  // - If booking is active and backend provided secondOtp, show that.
  // - Otherwise fall back to initialOtp passed via navigation (buyer-generated OTP).
  const displayOtp =
    booking && booking.status === "active" && booking.secondOtp
      ? booking.secondOtp
      : initialOtp;

  const otpLabel =
    booking && booking.status === "active" && booking.secondOtp
      ? "CHECK OUT OTP"
      : "CHECK IN OTP";

  const routeLayer = {
    id: "route",
    type: "line" as const,
    source: "route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#3887be", "line-width": 5 },
  };

  const routeSourceData = routeData
    ? {
        type: "Feature" as const,
        geometry: routeData.geometry,
      }
    : null;

  return (
    <div className="h-[calc(100vh-64px)] relative">
      <div className="relative h-full">
        <Map
          {...viewport}
          onMove={(evt) => setViewport(evt.viewState)}
          mapboxAccessToken="pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A"
          style={{ width: "100%", height: "100%" }}
          mapStyle="mapbox://styles/mapbox/streets-v11"
        >
          {/* Current Location Marker */}
          {currentLocation && (
            <Marker latitude={currentLocation.lat} longitude={currentLocation.lng}>
              <div className="text-blue-600">
                <MdGpsFixed size={30} />
              </div>
            </Marker>
          )}

          {/* Parking Space Marker */}
          {parkingSpace && (
            <Marker latitude={parkingSpace.location.coordinates[1]} longitude={parkingSpace.location.coordinates[0]}>
              <div className="text-green-600">
                <FaParking size={30} />
              </div>
            </Marker>
          )}

          {/* Route Layer */}
          {routeSourceData && (
            <Source id="route" type="geojson" data={routeSourceData}>
              <Layer {...routeLayer} />
            </Source>
          )}
        </Map>
      </div>

      {/* Status and OTP Display */}
      <div className="absolute bottom-4 left-4 right-4">
        <div className="bg-white rounded-lg shadow-lg p-4 space-y-3">
          <div className="text-center">
            <div className="text-lg font-semibold text-gray-800">
              Status: {booking ? (booking.status ? booking.status.charAt(0).toUpperCase() + booking.status.slice(1) : "Loading...") : "Loading..."}
            </div>

            {booking?.status === "active" && remainingMs !== null && (
              <div className="text-xl font-bold text-blue-600">Time Remaining: {formatTime(remainingMs)}</div>
            )}

            {/* Show OTP if we have one (either initial or second) */}
            {displayOtp ? (
              <div className="mt-3 p-3 bg-blue-50 rounded border">
                <div className="text-sm text-gray-600 mb-1">{otpLabel}</div>
                <div className="text-2xl font-mono font-bold text-blue-800">{displayOtp}</div>
                {initialOtpExpires && booking?.status !== "active" && (
                  <div className="text-xs text-gray-500 mt-1">Expires: {new Date(initialOtpExpires).toLocaleString()}</div>
                )}
              </div>
            ) : (
              // If booking is accepted and there's no OTP available to the buyer yet, show friendly note
              booking?.status === "accepted" && (
                <div className="text-sm text-orange-600 mt-2">
                  Waiting for provider to verify your OTP and start the session...
                </div>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
