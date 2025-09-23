import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { ToastContainer } from "react-toastify";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { MapProvider } from "./context/MapContext";
import Navbar from "./components/Navbar";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";
import KYC from "./pages/KYC";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import VerifyEmail from "./pages/VerifyEmail";
import RegisterParking from "./pages/RegisterParking";
import { env } from "./config/env";
import "react-toastify/dist/ReactToastify.css";
import "mapbox-gl/dist/mapbox-gl.css";
import AdminPanel from "./pages/Admin";
import VehicleDetails from "./pages/VehicleDetails";
import MyBookings from "./components/parking/MyBookings";
import ProviderBookings from "./pages/ProivderBookings";
import Page from "./pages/Page";
import AddVehicle from "./pages/AddVechicle";
import VehicleList from "./pages/VehicleList";
import TrackNowPage from "./components/parking/TrackNowPage";
import FilterParkingPage from "./pages/FilterParkingPage";
import ParkingDetails from "./pages/ParkinSpaceDetails";
import Dash from "./Dash";
import Front from "./pages/Front";
import Favorites from './pages/Favorite'
import FindParking from "./components/search/FindParking";
import Profile from "./pages/Profile";

export default function App() {
  return (
    <GoogleOAuthProvider clientId={env.GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <MapProvider>
          <Router>
            <AppRoutes />
          </Router>
        </MapProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

// 🔹 Component for managing dynamic routes
function AppRoutes() {
  const { user } = useAuth(); // 🔹 Get user authentication status from context

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={user ? <Home /> : <Front />} />

        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />
        <Route path="/vehicle-details" element={<ProtectedRoute><VehicleDetails /></ProtectedRoute>} />
        <Route path="/add-vechile" element={<ProtectedRoute><AddVehicle /></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><TrackNowPage /></ProtectedRoute>} />
        <Route path="/filter-parking" element={<ProtectedRoute><FilterParkingPage /></ProtectedRoute>} />
        <Route path="/parking-details" element={<ProtectedRoute><ParkingDetails /></ProtectedRoute>} />
        <Route path="/check-vechile" element={<ProtectedRoute> <VehicleList /></ProtectedRoute>} />
        <Route path="/bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
        <Route path="/parkingprovider" element={<ProtectedRoute><ProviderBookings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiresAdmin><AdminPanel /></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
        <Route path="/favorite" element={<Favorites />} />
        <Route path="/find" element={<FindParking />} />
        <Route path="/profileuser" element={<Profile />} />
        <Route path="/register-parking" element={<ProtectedRoute><RegisterParking /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dash /></ProtectedRoute>} />
      </Routes>
      <ToastContainer position="top-right" />
    </div>
  );
}
