import React from "react";
import { RoleProvider, useRole } from "./context/RoleContext";
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
import Favorites from './pages/Favorite';
import FindParking from "./components/search/FindParking";
import Profile from "./pages/Profile";
import { buyerRoutes } from "./routes/BuyerRoutes";
import { sellerRoutes } from "./routes/SellerRoutes";

/**
 * Minimal App.tsx replacement:
 * - useRole() is called inside AppRoutes (which is rendered inside RoleProvider)
 * - Front is given a safe no-op onLocationSelect via HomeOrFront wrapper
 * - Buyer and Seller route arrays are injected into <Routes>
 */

export default function App() {
  return (
    <GoogleOAuthProvider clientId={env.GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <RoleProvider>
          <MapProvider>
            <Router>
              <AppRoutes />
            </Router>
          </MapProvider>
        </RoleProvider>
      </AuthProvider>
    </GoogleOAuthProvider>
  );
}

function HomeOrFront({ user }: { user: any }) {
  // Defensive wrapper: pass a no-op handler to Front so it won't crash if it expects the prop.
  try {
    if (user) return <Home />;
    return <Front onLocationSelect={() => { /* no-op for landing page */ }} />;
  } catch (err) {
    // Render a safe fallback if something inside Home/Front throws
    // (this prevents a blank screen)
    // eslint-disable-next-line no-console
    console.error("Error rendering HomeOrFront:", err);
    return (
      <div style={{ padding: 24 }}>
        <h2>Something went wrong while rendering the front page.</h2>
        <p>Check the browser console for details.</p>
      </div>
    );
  }
}

// Component for managing dynamic routes
function AppRoutes() {
  const { user } = useAuth();

  // Because AppRoutes is rendered inside RoleProvider (see App above),
  // it's safe to call useRole() here.
  const { role } = useRole();

  // quick debug logs to help trace blank-screen causes — remove in production
  // eslint-disable-next-line no-console
  console.log("AppRoutes - user:", user, " role:", role);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        {/* Use wrapper which provides safe no-op for Front props */}
        <Route path="/" element={<HomeOrFront user={user} />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Shared protected routes */}
        <Route path="/vehicle-details" element={<ProtectedRoute><VehicleDetails /></ProtectedRoute>} />
        <Route path="/add-vechile" element={<ProtectedRoute><AddVehicle /></ProtectedRoute>} />
        <Route path="/track" element={<ProtectedRoute><TrackNowPage /></ProtectedRoute>} />
        <Route path="/filter-parking" element={<ProtectedRoute><FilterParkingPage /></ProtectedRoute>} />
        <Route path="/parking-details" element={<ProtectedRoute><ParkingDetails /></ProtectedRoute>} />
        <Route path="/check-vechile" element={<ProtectedRoute><VehicleList /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute requiresAdmin><AdminPanel /></ProtectedRoute>} />
        <Route path="/kyc" element={<ProtectedRoute><KYC /></ProtectedRoute>} />
        <Route path="/favorite" element={<Favorites />} />
        <Route path="/find" element={<FindParking />} />
        <Route path="/profileuser" element={<Profile />} />
        <Route path="/register-parking" element={<ProtectedRoute><RegisterParking /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dash /></ProtectedRoute>} />

        {/* Role-based routes — only include when user is present */}
        {user && role === "buyer" && buyerRoutes}
        {user && role === "seller" && sellerRoutes}
      </Routes>
      <ToastContainer position="top-right" />
    </div>
  );
}
