import React, { useEffect, useState } from "react";
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
import AddVehicle from "./pages/AddVechicle";
import VehicleList from "./pages/VehicleList";
import TrackNowPage from "./components/parking/TrackNowPage";
import FilterParkingPage from "./pages/FilterParkingPage";
import ParkingDetails from "./pages/ParkinSpaceDetails";
import Dash from "./Dash";
import Front from "./pages/Front";
import Favorites from "./pages/Favorite";
import FindParking from "./components/search/FindParking";
import Profile from "./pages/Profile";
import { buyerRoutes } from "./routes/BuyerRoutes";
import { sellerRoutes } from "./routes/SellerRoutes";
import { useFirebaseMessaging } from "./hooks/useFirebaseMessaging";
import EditProfile from "./pages/EditProfile";

// 🔹 Splash styles
import "./components/Splash.css";

export default function App() {
  const [splashVisible, setSplashVisible] = useState(true);
  const [splashHidden, setSplashHidden] = useState(false);

  useEffect(() => {
    const init = async () => {
      try {
        // keep splash for 3 seconds
        await new Promise((res) => setTimeout(res, 3000));
      } finally {
        setSplashHidden(true); // trigger fade out
        setTimeout(() => setSplashVisible(false), 400); // remove after fade
      }
    };
    init();
  }, []);

  if (splashVisible) {
    return (
      <div className={`splash-screen ${splashHidden ? "hidden" : ""}`}>
        <img src="/Park_your_Vehicle_log.png" alt="Splash Logo" className="splash-logo" />
      </div>
    );
  }

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
  const [showHome, setShowHome] = useState(false);
  useFirebaseMessaging(user);

  try {
    if (showHome) {
      return <Home />;
    }
    return <Front onProceed={() => setShowHome(true)} />;
  } catch (err) {
    console.error("Error rendering HomeOrFront:", err);
    return (
      <div style={{ padding: 24 }}>
        <h2>Something went wrong while rendering the front page.</h2>
        <p>Check the browser console for details.</p>
      </div>
    );
  }
}

function AppRoutes() {
  const { user } = useAuth();
  const { role } = useRole();
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <Routes>
        <Route path="/" element={<HomeOrFront user={user} />} />

        {/* Public routes */}
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password/:token" element={<ResetPassword />} />
        <Route path="/verify-email/:token" element={<VerifyEmail />} />

        {/* Protected routes */}
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
        <Route path="/edit-profile" element={<ProtectedRoute><EditProfile /></ProtectedRoute>} />

        {/* Role-based routes */}
        {user && role === "buyer" && buyerRoutes}
        {user && role === "seller" && sellerRoutes}
      </Routes>
      <ToastContainer position="top-right" />
    </div>
  );
}
