import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  User as UserIcon,
  Calendar,
  FileCheck,
  LayoutDashboard,
} from "lucide-react";
import { MdCalendarMonth, MdDashboard, MdHome, MdMap, MdPerson } from "react-icons/md";
import { useRole } from "../context/RoleContext";

// Vite serves files from public/ at the root path — use the root path instead of importing from /public
const logoUrl = "/Park_your_Vehicle_log.png";

export default function Navbar() {
  // NOTE: we request refreshUser so Navbar always shows up-to-date kycStatus
  const { isAuthenticated, logout, user, refreshUser } = useAuth();
  const { role, toggleRole } = useRole();

  // SSR-safe window usage for initial state
  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ---- Guarded refreshUser: call only once per user id ----
  // Remember which user id we've already refreshed to avoid loops
  const lastRef = useRef<string | null>(null);
  useEffect(() => {
    const userId = (user as any)?._id ?? null; // keep safe typing
    if (!isAuthenticated || !userId) return;

    // If we already refreshed for this user id, skip
    if (lastRef.current === userId) return;

    lastRef.current = userId;

    // fire-and-forget
    (async () => {
      try {
        await refreshUser();
      } catch (err) {
        // eslint-disable-next-line no-console
        console.warn("Navbar: refreshUser failed", err);
      }
    })();
  }, [isAuthenticated, (user as any)?._id, refreshUser]);

  // New: inject small role-based stylesheet and set data-role attribute so .home-icon can change color
  useEffect(() => {
    try {
      document.body.setAttribute("data-role", role);
    } catch {
      /* ignore in SSR */
    }

    const styleId = "navbar-role-styles";
    const existing = document.getElementById(styleId) as HTMLStyleElement | null;
    const red = "#ef4444"; // tailwind red-500
    const green = "#16a34a"; // tailwind emerald-600

    const css = `
      body[data-role="seller"] .home-icon { color: ${red} !important; }
      body[data-role="buyer"]  .home-icon { color: ${green} !important; }
      body[data-role="seller"] .home-icon svg { fill: ${red} !important; }
      body[data-role="buyer"]  .home-icon svg { fill: ${green} !important; }
    `;

    if (existing) {
      existing.textContent = css;
    } else {
      const style = document.createElement("style");
      style.id = styleId;
      style.type = "text/css";
      style.appendChild(document.createTextNode(css));
      document.head.appendChild(style);
    }

    return () => {
      const s = document.getElementById(styleId);
      if (s) s.textContent = "";
    };
  }, [role]);

  const getNavItemClass = (path: string) =>
    location.pathname === path
      ? "text-red-600 font-bold dark:text-red-400"
      : "text-gray-700 dark:text-gray-300";

  // -------------------------
  // Robust KYC visibility check
  // - handles null/undefined
  // - normalizes string casing
  // - treats any non-string as "not approved" (safe default)
  // Desired behaviour: hide KYC link once status is "submitted" or "approved"
  // -------------------------
  const rawKyc = (user as any)?.kycStatus ?? null;
  const kycNormalized =
    typeof rawKyc === "string" ? rawKyc.trim().toLowerCase() : null;
  const shouldShowKYC = !(kycNormalized === "submitted" || kycNormalized === "approved");
  // -------------------------

  if (isMobile) {
    return (

      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md border-t border-gray-200 z-50 dark:bg-gray-900 dark:border-gray-800">
  <div className="flex justify-around py-3 items-center">
    {isAuthenticated ? (
      <>
        {/* Home */}
        <Link to="/" className={`flex flex-col items-center ${getNavItemClass("/")}`}>
          <MdHome className="h-6 w-6 home-icon" />
          <span className="text-xs mt-1 font-medium">Home</span>
        </Link>

        {/* Bookings (buyers only) */}
        {role === "buyer" && (
          <Link to="/bookings" className={`flex flex-col items-center ${getNavItemClass("/bookings")}`}>
            <MdCalendarMonth className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">My Bookings</span>
          </Link>
        )}

        {/* Dashboard (sellers only) */}
        {role === "seller" && (
          <Link to="/dashboard" className={`flex flex-col items-center ${getNavItemClass("/dashboard")}`}>
            <MdDashboard className="h-6 w-6" />
            <span className="text-xs mt-1 font-medium">Dashboard</span>
          </Link>
        )}

        {/* Profile */}
        <Link to="/profileuser" className={`flex flex-col items-center ${getNavItemClass("/profileuser")}`}>
          <MdPerson className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">{(user as any)?.name || "Profile"}</span>
        </Link>

        {/* Logout */}
        <button
          onClick={logout}
          className="flex flex-col items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
        >
          <LogOut className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Logout</span>
        </button>

        {/* Role Toggle */}
        <div className="flex flex-col items-center ml-2">
          <label className="inline-flex items-center gap-2 select-none text-xs">
            <span>{role === "buyer" ? "Buyer" : "Seller"}</span>
            <input
              type="checkbox"
              className="sr-only"
              checked={role === "seller"}
              onChange={toggleRole}
              aria-checked={role === "seller"}
            />
            <div className={`w-12 h-6 rounded-full relative transition-colors ${role === "seller" ? "bg-red-500" : "bg-green-500"}`}>
              <span
                className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                  role === "seller" ? "translate-x-6" : "translate-x-0"
                }`}
              />
            </div>
          </label>
        </div>
      </>
    ) : (
      <>
        <Link to="/login" className={`flex flex-col items-center ${getNavItemClass("/login")}`}>
          <MdPerson className="h-6 w-6" />
          <span className="text-xs mt-1 font-medium">Login</span>
        </Link>
        <Link
          to="/register"
          className="flex flex-col items-center text-white bg-red-600 px-3 py-1 rounded-md hover:bg-red-700"
        >
          <span className="text-xs mt-1 font-medium">Register</span>
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
              <img className="h-6 w-6" src={logoUrl} alt="ParkYourVehicles" />
              <span className="font-bold text-xl text-gray-900 dark:text-gray-100">ParkYourVehicles</span>
            </Link>
          </div>

          <div className="hidden lg:flex items-center space-x-6">
            {isAuthenticated ? (
              <>
                <Link to="/" className={`flex items-center space-x-1 ${getNavItemClass("/")}`}>
                  <MdHome className="h-5 w-5 home-icon" />
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
                  <Link
                    to="/register-parking"
                    className={`flex items-center space-x-1 ${getNavItemClass("/register-parking")}`}
                  >
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
                  <span>{(user as any)?.name || "Profile"}</span>
                </Link>

                <button
                  onClick={logout}
                  className="flex items-center space-x-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                >
                  <LogOut className="h-5 w-5" />
                  <span>Logout</span>
                </button>

                {/* ---------- BEAUTIFUL ROLE TOGGLE (kept from your code) ---------- */}
                <label
                  className="inline-flex items-center gap-3 select-none"
                  aria-label="Toggle role between Buyer and Seller"
                  title={`Switch to ${role === "seller" ? "Buyer" : "Seller"}`}
                >
                  <span
                    className={`text-sm font-semibold transition-colors duration-250 ${
                      role === "seller" ? "text-gray-400" : "text-gray-900 dark:text-gray-100"
                    }`}
                  >
                    Buyer
                  </span>

                  <div className="relative">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={role === "seller"}
                      onChange={toggleRole}
                      aria-checked={role === "seller"}
                    />

                    <div
                      className={`w-16 h-8 rounded-full transition-colors duration-300 ease-out
                        ${role === "seller"
                          ? "bg-gradient-to-r from-pink-500 to-red-600 shadow-[0_8px_24px_rgba(239,68,68,0.18)]"
                          : "bg-gradient-to-r from-emerald-400 to-emerald-600 shadow-[0_8px_24px_rgba(16,185,129,0.12)]"
                        }`}
                      role="presentation"
                    />

                    <div
                      className={`absolute top-0 left-0 w-8 h-8 transform rounded-full bg-white dark:bg-gray-900
                        shadow-lg transition-all duration-400 ease-out flex items-center justify-center
                        ${role === "seller" ? "translate-x-8 scale-105" : "translate-x-0"}`}
                      style={{ willChange: "transform" }}
                      aria-hidden="true"
                    >
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-full transition-transform duration-300
                          ${role === "seller" ? "bg-red-50 text-red-600 animate-pulse-slow" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-900 dark:text-emerald-300"}`}
                      >
                        {role === "seller" ? (
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

                    <div
                      className={`pointer-events-none absolute inset-0 rounded-full transition-opacity duration-300 ${
                        role === "seller" ? "opacity-60" : "opacity-60"
                      }`}
                      style={{
                        background:
                          role === "seller"
                            ? "radial-gradient(circle at 20% 50%, rgba(255,99,132,0.08), transparent 30%)"
                            : "radial-gradient(circle at 20% 50%, rgba(16,185,129,0.08), transparent 30%)",
                      }}
                      aria-hidden="true"
                    />
                  </div>

                  <span
                    className={`text-sm font-semibold transition-colors duration-250 ${
                      role === "seller" ? "text-gray-900 dark:text-gray-100" : "text-gray-400"
                    }`}
                  >
                    Seller
                  </span>
                </label>

                {/* end role toggle */}
              </>
            ) : (
              <>
                <Link to="/login" className={`px-3 py-2 ${getNavItemClass("/login")}`}>
                  Login
                </Link>
                <Link to="/register" className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700">
                  Register
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
