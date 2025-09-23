import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { LogOut, User, MapPin, Calendar, FileCheck, Home, LucideHome, LayoutDashboard } from "lucide-react";
import { MdCalendarMonth, MdDashboard, MdHome, MdMap, MdPerson } from "react-icons/md";
import logo from '../../public/Park_your_Vehicle_log.png?url'
export default function Navbar() {
  const { isAuthenticated, logout, user } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();
  
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const getNavItemClass = (path:any) => location.pathname === path ? "text-red-600 font-bold" : "text-gray-700";

  const shouldShowKYC = user?.kycStatus !== "submitted" && user?.kycStatus !== "approved"; ;
  console.log( user?.kycStatus);
  

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md border-t border-gray-200 z-50">
        <div className="flex justify-around py-3">
          {isAuthenticated ? (
            <>
              <Link to="/" className={`flex flex-col items-center ${getNavItemClass("/")}`}>
                <LucideHome className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">Home</span>
              </Link>

              {shouldShowKYC ? (
                <Link to="/kyc" className={`flex flex-col items-center ${getNavItemClass("/kyc")}`}>
                  <FileCheck className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">KYC</span>
                </Link>
              ) : (
                <Link to="/register-parking" className={`flex flex-col items-center ${getNavItemClass("/register-parking")}`}>
                  <MdMap className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">Register Space</span>
                </Link>
              )}

              <Link to="/dashboard" className={`flex flex-col items-center ${getNavItemClass("/dashboard")}`}>
                <LayoutDashboard className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">Dashboard</span>
              </Link>

              <Link to="/bookings" className={`flex flex-col items-center ${getNavItemClass("/bookings")}`}>
                <Calendar className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">Bookings</span>
              </Link>

              <Link to="/profileuser" className={`flex flex-col items-center ${getNavItemClass("/profileuser")}`}>
                <User className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">{user?.name}</span>
              </Link>

              <button onClick={logout} className="flex flex-col items-center text-red-600 hover:text-red-700">
                <LogOut className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">Logout</span>
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
    <nav className="bg-white shadow-lg z-50 relative">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <img className="h-6 w-6 " src={logo}/>
              <span className="font-bold text-xl">ParkYourVehicles</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link to="/" className={`flex items-center space-x-1 ${getNavItemClass("/")}`}>
                  <MdHome className="h-5 w-5" />
                  <span>Home</span>
                </Link>

                {shouldShowKYC ? (
                  <Link to="/kyc" className={`flex items-center space-x-1 ${getNavItemClass("/kyc")}`}>
                    <MdMap className="h-5 w-5" />
                    <span>KYC</span>
                  </Link>
                ) : (
                  <Link to="/register-parking" className={`flex items-center space-x-1 ${getNavItemClass("/register-parking")}`}>
                    <MdMap className="h-5 w-5" />
                    <span>Register Space</span>
                  </Link>
                )}

                <Link to="/bookings" className={`flex items-center space-x-1 ${getNavItemClass("/bookings")}`}>
                  <MdCalendarMonth className="h-5 w-5" />
                  <span>My Bookings</span>
                </Link>

                <Link to="/dashboard" className={`flex items-center space-x-1 ${getNavItemClass("/dashboard")}`}>
                  <MdDashboard className="h-6 w-6" />
                  <span>Dashboard</span>
                </Link>

                <Link to="/profileuser" className={`flex items-center space-x-1 ${getNavItemClass("/profileuser")}`}>
                  <MdPerson className="h-5 w-5" />
                  <span>{user?.name}</span>
                </Link>

                <button onClick={logout} className="flex items-center space-x-1 text-red-600 hover:text-red-700">
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
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
