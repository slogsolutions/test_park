import React, { useEffect, useState } from "react";
import Map, { Source, Layer, Marker } from "react-map-gl";
import { toast } from "react-toastify";
import { useLocation, useNavigate } from "react-router-dom";
import { MdLocationOn, MdGpsFixed } from "react-icons/md";
import { FaParking } from "react-icons/fa";
import { useMapContext } from "../../context/MapContext";
import axios from "axios";

export default function TrackNowPage() {
  const { viewport, setViewport } = useMapContext();
  const navigate = useNavigate();
  const location = useLocation();

  const [routeData, setRouteData] = useState<any>(null);
  const [currentLocation, setCurrentLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);

  // Extract parking space and OTP from location.state
  const { parkingSpace, otp } = location.state || {};

  useEffect(() => {
    if (!parkingSpace || !otp) {
      toast.error("Invalid booking data. Redirecting...");
      navigate("/");
      return;
    }

    // Fetch user location
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setCurrentLocation({ lat: latitude, lng: longitude });
          setViewport({ ...viewport, latitude, longitude });

          // Fetch the route
          const [destLng, destLat] = parkingSpace.location.coordinates;
          fetchRoute(latitude, longitude, destLat, destLng);
        },
        (error) => {
          console.error("Location error:", error);
          toast.error("Could not get your location. Please enable location services.");
        }
      );
    }
  }, [parkingSpace]);

  const fetchRoute = async (
    originLat: number,
    originLng: number,
    destLat: number,
    destLng: number
  ) => {
    try {
      const response = await axios.get(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${originLng},${originLat};${destLng},${destLat}`,
        {
          params: {
            alternatives: false,
            geometries: "geojson",
            overview: "full",
            steps: true,
            access_token: "pk.eyJ1IjoicGFya2Vhc2UxIiwiYSI6ImNtNGN1M3pmZzBkdWoya3M4OGFydjgzMzUifQ.wbsW51a7zFMq0yz0SeV6_A",
          },
        }
      );
      setRouteData(response.data.routes[0]);
    } catch (error) {
      toast.error("Failed to fetch route.");
    }
  };

  const routeLayer = {
    id: "route",
    type: "line",
    source: "route",
    layout: { "line-cap": "round", "line-join": "round" },
    paint: { "line-color": "#3887be", "line-width": 5 },
  };

  const routeSourceData = routeData
    ? {
        type: "Feature",
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
            <Marker
              latitude={parkingSpace.location.coordinates[1]}
              longitude={parkingSpace.location.coordinates[0]}
            >
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

      {/* OTP Display */}
      <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center">
        <div className="bg-blue-600 text-white text-xl font-bold py-2 px-6 rounded shadow-lg">
          OTP: {otp}
        </div>
      </div>
    </div>
  );
}
