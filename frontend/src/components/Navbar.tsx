import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  User,
  Calendar,
  FileCheck,
  LayoutDashboard,
} from "lucide-react";
import { MdCalendarMonth, MdDashboard, MdHome, MdMap, MdPerson } from "react-icons/md";
import logo from '../../public/Park_your_Vehicle_log.png?url';
import { useRole } from "../context/RoleContext";

export default function Navbar() {
  // NOTE: we now request refreshUser so Navbar always shows up-to-date kycStatus
  const { isAuthenticated, logout, user, refreshUser } = useAuth();
  const { role, toggleRole } = useRole();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // When the user becomes authenticated (or on mount if already authenticated),
  // refresh the global user object so kycStatus is current and Navbar updates immediately.
  useEffect(() => {
    if (isAuthenticated && typeof refreshUser === 'function') {
      // fire-and-forget; we don't need to await, but handle errors gracefully
      refreshUser().catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Navbar: refreshUser failed', err);
      });
    }
  }, [isAuthenticated, refreshUser]);

  const getNavItemClass = (path: any) =>
    location.pathname === path
      ? "text-red-600 font-bold dark:text-red-400"
      : "text-gray-700 dark:text-gray-300";

  // Only show KYC link if not already submitted/approved
  const shouldShowKYC = user?.kycStatus !== "submitted" && user?.kycStatus !== "approved";

  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md border-t border-gray-200 z-50 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex justify-around py-3">
          {isAuthenticated ? (
            <>
              <Link to="/" className={`flex flex-col items-center ${getNavItemClass("/")}`}>
                <MdHome className="h-6 w-6" />
              </Link>

              {/* Show KYC only if not approved */}
              {shouldShowKYC && (
                <Link to="/kyc" className={`flex flex-col items-center ${getNavItemClass("/kyc")}`}>
                  <FileCheck className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">KYC</span>
                </Link>
              )}

              {/* Register Space only visible for sellers AFTER KYC is approved */}
              {!shouldShowKYC && role === "seller" && (
                <Link to="/register-parking" className={`flex flex-col items-center ${getNavItemClass("/register-parking")}`}>
                  <MdMap className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">Register Space</span>
                </Link>
              )}

              {/* Bookings link - only for buyers */}
              {role === "buyer" && (
                <Link to="/bookings" className={`flex flex-col items-center ${getNavItemClass("/bookings")}`}>
                  <Calendar className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">My Bookings</span>
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
                </Link>

                {/* Show KYC only if not approved */}
                {shouldShowKYC && (
                  <Link to="/kyc" className={`flex items-center space-x-1 ${getNavItemClass("/kyc")}`}>
                    <FileCheck className="h-5 w-5" />
                    <span>KYC</span>
                  </Link>
                )}

                {/* Register Space only visible for sellers AFTER KYC is approved */}
                {!shouldShowKYC && role === "seller" && (
                  <Link to="/register-parking" className={`flex items-center space-x-1 ${getNavItemClass("/register-parking")}`}>
                    <MdMap className="h-5 w-5" />
                    <span>Register Space</span>
                  </Link>
                )}

                {/* Bookings link - only for buyers */}
                {role === "buyer" && (
                  <Link to="/bookings" className={`flex items-center space-x-1 ${getNavItemClass("/bookings")}`}>
                    <MdCalendarMonth className="h-5 w-5" />
                    <span>My Bookings</span>
                  </Link>
                )}

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

{/* ---------- BEAUTIFUL ROLE TOGGLE (replace existing label block) ---------- */}
<label
  className="inline-flex items-center gap-3 select-none"
  aria-label="Toggle role between Buyer and Seller"
  title={`Switch to ${role === 'seller' ? 'Buyer' : 'Seller'}`}
>
  {/* Left label */}
  <span className={`text-sm font-semibold transition-colors duration-250 ${
    role === 'seller' ? 'text-gray-400' : 'text-gray-900 dark:text-gray-100'
  }`}>Buyer</span>

  <div className="relative">
    {/* real (visually hidden) checkbox for accessibility */}
    <input
      type="checkbox"
      className="sr-only"
      checked={role === 'seller'}
      onChange={toggleRole}
      aria-checked={role === 'seller'}
    />

    {/* track */}
    <div
      className={`w-16 h-8 rounded-full transition-colors duration-300 ease-out
        ${role === 'seller'
          ? 'bg-gradient-to-r from-pink-500 to-red-600 shadow-[0_8px_24px_rgba(239,68,68,0.18)]'
          : 'bg-gradient-to-r from-slate-200 to-slate-300 dark:from-gray-700 dark:to-gray-600'
        }`}
      role="presentation"
    />

    {/* moving knob */}
    <div
      className={`absolute top-0 left-0 w-8 h-8 transform rounded-full bg-white dark:bg-gray-900
        shadow-lg transition-all duration-400 ease-out flex items-center justify-center
        ${role === 'seller' ? 'translate-x-8 scale-105' : 'translate-x-0'}
        `}
      style={{ willChange: 'transform' }}
      aria-hidden="true"
    >
      {/* fancy micro-icon + subtle pulsing when active */}
      <span
        className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-300
          ${role === 'seller' ? 'bg-red-50 text-red-600 animate-pulse-slow' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-200'}`}
      >
        {/* switch icon: shop for seller, user/bookmark for buyer */}
        {role === 'seller' ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M3 7l9-5 9 5v2H3V7zm1 4h16v8a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1v-8z" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
            <path d="M12 12a5 5 0 100-10 5 5 0 000 10zm0 2c-4.418 0-8 1.79-8 4v2h16v-2c0-2.21-3.582-4-8-4z" />
          </svg>
        )}
      </span>
    </div>

    {/* hover glow overlay (purely decorative) */}
    <div
      className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300
        ${role === 'seller' ? 'opacity-60' : 'opacity-0'}`}
      style={{ background: 'radial-gradient(circle at 20% 50%, rgba(255,99,132,0.08), transparent 30%)' }}
      aria-hidden="true"
    />
  </div>

  {/* Right label */}
  <span className={`text-sm font-semibold transition-colors duration-250 ${
    role === 'seller' ? 'text-gray-900 dark:text-gray-100' : 'text-gray-400'
  }`}>Seller</span>
</label>

{/*
  Tailwind helper animation: add this to your tailwind config `animation` or inline via existing classes.
  If you don't have a custom 'animate-pulse-slow', you can quickly add:
  In global CSS (if allowed) or tailwind config -> animation: { 'pulse-slow': 'pulse 2.2s cubic-bezier(...) infinite' }
  As fallback, the icon will still show / not break if that animation isn't defined.
*/}

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
