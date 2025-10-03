import React, { useState, useEffect, useRef } from "react"; 
import { Link, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import {
  LogOut,
  User as UserIcon,
  FileCheck,
  LayoutDashboard,
} from "lucide-react";
import { MdDashboard, MdHome, MdMap, MdPerson } from "react-icons/md";
import { useRole } from "../context/RoleContext";

const logoUrl = "/Park_your_Vehicle_log.png";

export default function Navbar() {
  const { isAuthenticated, logout, user, refreshUser } = useAuth();
  const { role, toggleRole } = useRole();

  const [isMobile, setIsMobile] = useState<boolean>(
    typeof window !== "undefined" ? window.innerWidth < 768 : false
  );
  const location = useLocation();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const lastRef = useRef<string | null>(null);
  useEffect(() => {
    const userId = (user as any)?._id ?? null;
    if (!isAuthenticated || !userId) return;
    if (lastRef.current === userId) return;
    lastRef.current = userId;

    (async () => {
      try {
        await refreshUser();
      } catch (err) {
        console.warn("Navbar: refreshUser failed", err);
      }
    })();
  }, [isAuthenticated, (user as any)?._id, refreshUser]);

  useEffect(() => {
    document.body.setAttribute("data-role", role);
    const styleId = "navbar-role-styles";
    const existing = document.getElementById(styleId) as HTMLStyleElement | null;
    const red = "#ef4444";
    const green = "#16a34a";
    const css = `
      body[data-role="seller"] .home-icon { color: ${red} !important; }
      body[data-role="buyer"]  .home-icon { color: ${green} !important; }
      body[data-role="seller"] .home-icon svg { fill: ${red} !important; }
      body[data-role="buyer"]  .home-icon svg { fill: ${green} !important; }
    `;
    if (existing) existing.textContent = css;
    else {
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

  const rawKyc = (user as any)?.kycStatus ?? null;
  const kycNormalized =
    typeof rawKyc === "string" ? rawKyc.trim().toLowerCase() : null;
  const shouldShowKYC = !(kycNormalized === "submitted" || kycNormalized === "approved");

  // -------- MOBILE NAV --------
  if (isMobile) {
    return (
      <nav className="fixed bottom-0 left-0 w-full bg-white shadow-md border-t border-gray-200 z-50 dark:bg-gray-900 dark:border-gray-800">
        <div className="flex justify-around py-3">
          {isAuthenticated ? (
            <>
              <Link to="/" className={`flex flex-col items-center ${getNavItemClass("/")}`}>
                <MdHome className="h-6 w-6 home-icon" />
              </Link>

              {shouldShowKYC && (
                <Link to="/kyc" className={`flex flex-col items-center ${getNavItemClass("/kyc")}`}>
                  <FileCheck className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">KYC</span>
                </Link>
              )}

              {!shouldShowKYC && role === "seller" && (
                <Link
                  to="/register-parking"
                  className={`flex flex-col items-center ${getNavItemClass("/register-parking")}`}
                >
                  <MdMap className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">Register Space</span>
                </Link>
              )}

              {role === "seller" && (
                <Link to="/dashboard" className={`flex flex-col items-center ${getNavItemClass("/dashboard")}`}>
                  <LayoutDashboard className="h-6 w-6" />
                  <span className="text-xs mt-1 font-medium">Dashboard</span>
                </Link>
              )}

              <Link to="/profileuser" className={`flex flex-col items-center ${getNavItemClass("/profileuser")}`}>
                <UserIcon className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">{(user as any)?.name || "Profile"}</span>
              </Link>

              <button
                onClick={logout}
                className="flex flex-col items-center text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
              >
                <LogOut className="h-6 w-6" />
                <span className="text-xs mt-1 font-medium">Logout</span>
              </button>

              <button onClick={toggleRole} className="flex flex-col items-center text-gray-700 dark:text-gray-300">
                <span className="text-xs mt-1 font-medium">Switch to {role === "buyer" ? "Seller" : "Buyer"}</span>
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className={`flex flex-col items-center ${getNavItemClass("/login")}`}>
                <UserIcon className="h-6 w-6" />
                <span className="text-xs">Login</span>
              </Link>
              <Link
                to="/register"
                className="flex flex-col items-center text-white bg-red-600 px-3 py-1 rounded-md hover:bg-red-700"
              >
                <span className="text-xs">Register</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    );
  }

  // -------- DESKTOP NAV --------
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

                {shouldShowKYC && (
                  <Link to="/kyc" className={`flex items-center space-x-1 ${getNavItemClass("/kyc")}`}>
                    <FileCheck className="h-5 w-5" />
                    <span>KYC</span>
                  </Link>
                )}

                {!shouldShowKYC && role === "seller" && (
                  <Link
                    to="/register-parking"
                    className={`flex items-center space-x-1 ${getNavItemClass("/register-parking")}`}
                  >
                    <MdMap className="h-5 w-5" />
                    <span>Register Space</span>
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

                {/* Role toggle remains unchanged */}
                <label className="inline-flex items-center gap-3 select-none" aria-label="Toggle role">
                  <span className={`text-sm font-semibold ${role === "seller" ? "text-gray-400" : "text-gray-900 dark:text-gray-100"}`}>Buyer</span>
                  <input type="checkbox" className="sr-only" checked={role === "seller"} onChange={toggleRole} />
                  <span className="w-16 h-8 rounded-full bg-gray-300 dark:bg-gray-700 relative"></span>
                  <span className={`text-sm font-semibold ${role === "seller" ? "text-gray-900 dark:text-gray-100" : "text-gray-400"}`}>Seller</span>
                </label>
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
