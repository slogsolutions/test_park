import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  User,
  Calendar,
  FileCheck,
  LucideHome,
  LayoutDashboard,
} from "lucide-react";
import { MdCalendarMonth, MdDashboard, MdHome, MdMap, MdPerson } from "react-icons/md";
import logo from '../../public/Park_your_Vehicle_log.png?url';
import { useRole } from "../context/RoleContext";

export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const { role, toggleRole } = useRole();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getNavItemClass = (path: any) =>
    location.pathname === path
      ? "text-red-600 font-bold dark:text-red-400"
      : "text-gray-700 dark:text-gray-300";

  // ✅ Only show KYC link if not already submitted/approved
  const shouldShowKYC = user?.kycStatus !== "submitted" && user?.kycStatus !== "approved";

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md border-t border-gray-200 z-50 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex justify-around py-3">
          {isAuthenticated ? (
            <>
              <Link to="/" className={`flex flex-col items-center ${getNavItemClass("/")}`}>
                <LucideHome className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">Home</span>
              </Link>

              {/* ✅ Show KYC only if not approved */}
              {shouldShowKYC && (
                <Link to="/kyc" className={`flex flex-col items-center ${getNavItemClass("/kyc")}`}>
                  <FileCheck className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">KYC</span>
                </Link>
              )}

              {/* ✅ Register Space only visible for sellers AFTER KYC is approved */}
              {!shouldShowKYC && role === "seller" && (
                <Link to="/register-parking" className={`flex flex-col items-center ${getNavItemClass("/register-parking")}`}>
                  <MdMap className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">Register Space</span>
                </Link>
              )}

              {role === "buyer" ? (
                <Link to="/bookings" className={`flex flex-col items-center ${getNavItemClass("/bookings")}`}>
                  <Calendar className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">My Bookings</span>
                </Link>
              ) : (
                <Link to="/parkingprovider" className={`flex flex-col items-center ${getNavItemClass("/parkingprovider")}`}>
                  <Calendar className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">Bookings</span>
                </Link>
              )}

              {role === "seller" && (
                <Link to="/dashboard" className={`flex flex-col items-center ${getNavItemClass("/dashboard")}`}>
                  <LayoutDashboard className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">Dashboard</span>
                </Link>
              )}

              <Link to="/profileuser" className={`flex flex-col items-center ${getNavItemClass("/profileuser")}`}>
                <User className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">{user?.name || "Profile"}</span>
              </Link>

              <button
                onClick={logout}
                className="flex flex-col items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <LogOut className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">Logout</span>
              </button>

              <button
                onClick={toggleRole}
                className="flex flex-col items-center text-gray-700 dark:text-gray-300"
              >
                <span className="text-xs mt-1 font-medium">
                  Switch to {role === "buyer" ? "Seller" : "Buyer"}
                </span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`flex flex-col items-center ${getNavItemClass("/login")}`}>
                <User className="h-6 w-6" />
                <span className="text-xs">Login</span>
              </Link>
              <Link to="/register" className="flex flex-col items-center text-white bg-red-600 px-3 py-1 rounded-md hover:bg-red-700">
                <span className="text-xs">Register</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    );
  }

  return (
    <nav className="bg-white shadow-lg z-50 relative dark:bg-gray-900 dark:border-b dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16 items-center">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img className="h-6 w-6" src={logo} alt="ParkYourVehicles" />
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100">ParkYourVehicles</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/" className={`flex items-center space-x-1 ${getNavItemClass("/")}`}>
                  <MdHome className="h-5 w-5" />
                  <span>Home</span>
                </Link>

                {/* ✅ Show KYC only if not approved */}
                {shouldShowKYC && (
                  <Link to="/kyc" className={`flex items-center space-x-1 ${getNavItemClass("/kyc")}`}>
                    <FileCheck className="h-5 w-5" />
                    <span>KYC</span>
                  </Link>
                )}

                {/* ✅ Register Space only visible for sellers AFTER KYC is approved */}
                {!shouldShowKYC && role === "seller" && (
                  <Link to="/register-parking" className={`flex items-center space-x-1 ${getNavItemClass("/register-parking")}`}>
                    <MdMap className="h-5 w-5" />
                    <span>Register Space</span>
                  </Link>
                )}

                <Link to={role === "buyer" ? "/bookings" : "/parkingprovider"} className={`flex items-center space-x-1 ${getNavItemClass(role === "buyer" ? "/bookings" : "/parkingprovider")}`}>
                  <MdCalendarMonth className="h-5 w-5" />
                  <span>{role === "buyer" ? "My Bookings" : "Bookings"}</span>
                </Link>

                {role === "seller" && (
                  <Link to="/dashboard" className={`flex items-center space-x-1 ${getNavItemClass("/dashboard")}`}>
                    <MdDashboard className="h-6 w-6" />
                    <span>Dashboard</span>
                  </Link>
                )}

                <Link to="/profileuser" className={`flex items-center space-x-1 ${getNavItemClass("/profileuser")}`}>
                  <MdPerson className="h-5 w-5" />
                  <span>{user?.name || "Profile"}</span>
                </Link>

                <button onClick={logout} className="flex items-center space-x-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300">
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>

                <button
                  onClick={toggleRole}
                  className="px-3 py-1 rounded-full text-sm font-medium 
                            bg-gray-100 text-gray-800 hover:bg-gray-200 
                            dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700 
                            transition-colors"
                >
                  Switch to {role === "buyer" ? "Seller" : "Buyer"}
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className={`px-3 py-2 ${getNavItemClass("/login")}`}>Login</Link>
                <Link to="/register" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">Register</Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
