// src/pages/Profile.tsx
import React, { useEffect, useMemo, useState, Suspense } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Loader from "./LoadingScreen";

// Lazy-load ProviderSpaces only used for seller view
const LazyProviderSpaces = React.lazy(() => import("../components/dashboard/ProviderSpaces"));

/**
 * Defensive, single-file Profile page that supports:
 * - Buyer view (no spaces, only bookings count, no rating)
 * - Seller view (spaces, bookings, rating)
 *
 * IMPORTANT:
 * - Expects VITE_BASE_URL in env and a token in localStorage
 * - Install framer-motion if not installed: npm install framer-motion
 */

interface UserProfile {
  _id?: string;
  name?: string;
  email?: string;
  avatar?: string;
  bio?: string;
  bookings?: any[]; // optionally included by backend
  spaces?: any[];
  providerSpaces?: any[];
  parkingSpaces?: any[];
  spacesCount?: number;
  rating?: number;
  updatedAt?: string;
  role?: string; // 'seller' or 'buyer'
  isSeller?: boolean;
  seller?: boolean;
  type?: string;
  kycData?: {
    address?: string;
    city?: string;
    country?: string;
    fullName?: string;
    phoneNumber?: string;
    zipCode?: string;
    status?: string; // 'done'|'pending' etc.
    verified?: boolean;
  };
}

const floatVariants = {
  float: {
    y: [0, -12, 0],
    transition: { duration: 6, repeat: Infinity, ease: "easeInOut" },
  },
};

function useCountUp(target: number, duration = 1200) {
  const [value, setValue] = useState(0);
  useEffect(() => {
    let start = 0;
    const stepTime = Math.max(Math.floor(duration / Math.max(1, target)), 8);
    const timer = setInterval(() => {
      start += Math.max(1, Math.round(target / Math.max(1, duration / stepTime)));
      if (start >= target) {
        setValue(target);
        clearInterval(timer);
      } else {
        setValue(start);
      }
    }, stepTime);
    return () => clearInterval(timer);
  }, [target, duration]);
  return value;
}

export default function Profile() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<"Profile" | "Spaces">("Profile");

  // counts fetched as needed
  const [bookingsCountFetched, setBookingsCountFetched] = useState<number | null>(null);
  const [spacesCountFetched, setSpacesCountFetched] = useState<number | null>(null);

  // determine base url
  const API_BASE = import.meta.env.VITE_BASE_URL || "";

  useEffect(() => {
    let mounted = true;

    async function loadProfileAndCounts() {
      setIsLoading(true);
      setError(null);

      try {
        if (!API_BASE) throw new Error("VITE_BASE_URL is not set (check .env).");

        const token = localStorage.getItem("token");
        if (!token) throw new Error("No auth token found (please log in).");

        // fetch profile
        const res = await fetch(`${API_BASE}/api/auth/me`, {
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        });

        if (!res.ok) {
          const txt = await res.text().catch(() => "");
          throw new Error(`Failed to fetch profile: ${res.status} ${txt}`);
        }

        const data: UserProfile = await res.json();
        if (!mounted) return;
        setProfile(data);

        // detect role: seller if any of these flags present
        const isSeller =
          data?.role === "seller" || data?.isSeller === true || data?.seller === true || data?.type === "seller";

        // bookings: prefer profile.bookings length, otherwise fetch counts
        if (!data?.bookings) {
          // fetch bookings according to role
          if (isSeller) {
            try {
              const bRes = await fetch(`${API_BASE}/api/booking/provider-bookings`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              });
              if (bRes.ok) {
                const bData = await bRes.json();
                const len = Array.isArray(bData) ? bData.length : typeof bData.count === "number" ? bData.count : 0;
                if (mounted) setBookingsCountFetched(len);
              } else {
                console.warn("provider-bookings request failed:", bRes.status);
              }
            } catch (err) {
              console.warn("provider-bookings fetch failed:", err);
            }
          } else {
            // buyer bookings
            try {
              const ubRes = await fetch(`${API_BASE}/api/booking/user-bookings`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              });
              if (ubRes.ok) {
                const ubData = await ubRes.json();
                const len = Array.isArray(ubData) ? ubData.length : typeof ubData.count === "number" ? ubData.count : 0;
                if (mounted) setBookingsCountFetched(len);
              } else {
                console.warn("user-bookings request failed:", ubRes.status);
              }
            } catch (err) {
              console.warn("user-bookings fetch failed:", err);
            }
          }
        } else {
          // profile includes bookings array
          if (mounted) setBookingsCountFetched(Array.isArray(data.bookings) ? data.bookings.length : null);
        }

        // spaces count for seller if not present in profile
        if (isSeller) {
          if (!data?.spaces && typeof data?.spacesCount !== "number") {
            try {
              // attempt to fetch provider's spaces list (reuse provider spaces component endpoint if exists)
              const sRes = await fetch(`${API_BASE}/api/parking/get-provider-spaces`, {
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
              });
              if (sRes.ok) {
                const sData = await sRes.json();
                const len = Array.isArray(sData) ? sData.length : typeof sData.count === "number" ? sData.count : 0;
                if (mounted) setSpacesCountFetched(len);
              } else {
                // fallback: check providerSpaces or parkingSpaces
                const altLen =
                  Array.isArray((data as any).providerSpaces) ? (data as any).providerSpaces.length : undefined;
                if (typeof altLen === "number" && mounted) setSpacesCountFetched(altLen);
              }
            } catch (err) {
              console.warn("provider spaces fetch failed:", err);
            }
          } else {
            // profile includes spaces or spacesCount
            const derived =
              (Array.isArray(data?.spaces) && data.spaces.length) ||
              (Array.isArray((data as any).providerSpaces) && (data as any).providerSpaces.length) ||
              (typeof data?.spacesCount === "number" && data.spacesCount) ||
              (Array.isArray((data as any).parkingSpaces) && (data as any).parkingSpaces.length) ||
              0;
            if (mounted) setSpacesCountFetched(derived);
          }
        }

      } catch (err: any) {
        console.error("Profile load error:", err);
        if (mounted) setError(err?.message || "Failed to load profile.");
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    loadProfileAndCounts();
    return () => {
      mounted = false;
    };
  }, [API_BASE]);

  // detect role (buyer vs seller) from profile
  const isSeller = useMemo(() => {
    if (!profile) return false;
    return (
      profile.role === "seller" ||
      profile.isSeller === true ||
      profile.seller === true ||
      profile.type === "seller"
    );
  }, [profile]);

  // Determine counts (prefer fetched counts, fallback to profile fields)
  const bookingsCount = useMemo(() => {
    if (typeof bookingsCountFetched === "number") return bookingsCountFetched;
    if (Array.isArray(profile?.bookings)) return profile!.bookings!.length;
    return 0;
  }, [bookingsCountFetched, profile]);

  const spacesCount = useMemo(() => {
    if (typeof spacesCountFetched === "number") return spacesCountFetched;
    if (Array.isArray(profile?.spaces)) return profile!.spaces!.length;
    if (Array.isArray((profile as any)?.providerSpaces)) return (profile as any).providerSpaces.length;
    if (typeof profile?.spacesCount === "number") return profile!.spacesCount;
    return 0;
  }, [spacesCountFetched, profile]);

  // show bookings stat on left only if KYC status is 'done' or 'pending'
  const kycShowsBookings = useMemo(() => {
    const s = (profile?.kycData?.status || "").toString().toLowerCase();
    return s === "done" || s === "pending";
  }, [profile]);

  // rating for sellers only
  const rating = useMemo(() => {
    if (!isSeller) return null;
    return profile?.rating ?? 0;
  }, [isSeller, profile]);

  // animate counters
  const bookingsCountAnim = useCountUp(bookingsCount);
  const spacesCountAnim = useCountUp(spacesCount);
  const ratingCountAnim = useCountUp(Math.round((rating ?? 0) * 10)); // show as x.x later

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-lg bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold text-red-600">Profile Error</h3>
          <p className="text-sm text-gray-700 mt-2">{error}</p>
          <p className="text-xs text-gray-400 mt-2">Check console for details.</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return <div className="p-6 text-center">No profile data available.</div>;
  }

  return (
    <div className="min-h-screen pb-20 bg-gray-50 relative overflow-hidden">
      {/* Animated background blobs */}
      <div className="absolute inset-0 -z-10">
        <motion.div
          variants={floatVariants}
          animate="float"
          className="absolute w-[420px] h-[420px] rounded-full opacity-30 blur-3xl"
          style={{ background: "linear-gradient(135deg,#ffd1d1,#ffdbe2)", left: "-6%", top: "-6%" }}
        />
        <motion.div
          variants={floatVariants}
          animate={{ y: [10, -10, 10] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 0.2 }}
          className="absolute w-[380px] h-[380px] rounded-full opacity-25 blur-2xl"
          style={{ background: "linear-gradient(120deg,#dbeafe,#e6f7ff)", right: "-4%", top: "6%" }}
        />
        <motion.div
          variants={floatVariants}
          animate={{ y: [-6, 6, -6] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
          className="absolute w-[320px] h-[320px] rounded-full opacity-22 blur-3xl"
          style={{ background: "linear-gradient(120deg,#e6ffe6,#fff1f0)", left: "30%", bottom: "-8%" }}
        />
      </div>

      <div className="container mx-auto px-6 lg:px-20">
        <div className="flex justify-between items-center pt-8">
          <div>
            <motion.h1 initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }} className="text-2xl lg:text-3xl font-extrabold text-gray-800">
              Your Profile
            </motion.h1>
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.25 }} className="text-sm text-gray-500">
              A snapshot of your account & activity — animated ✨
            </motion.p>
          </div>

          <div className="flex items-center gap-4">
            <motion.button whileTap={{ scale: 0.95 }} whileHover={{ scale: 1.03 }} className="px-4 py-2 rounded-full bg-white border shadow-sm text-sm" onClick={() => location.reload()}>
              Refresh
            </motion.button>
            {/* Edit Profile button kept (you said edit profile not working; keep it here) */}
            <motion.button whileHover={{ scale: 1.02 }} className="px-4 py-2 rounded-full bg-gradient-to-r from-red-500 to-pink-500 text-white font-semibold shadow-lg">
              Edit Profile
            </motion.button>
          </div>
        </div>

        <div className="mt-12 grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Left: Profile Card */}
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="col-span-1 bg-white/70 backdrop-blur-md rounded-2xl p-8 shadow-xl border border-white/40">
            <div className="flex flex-col items-center text-center">
              <motion.div initial={{ scale: 0.96 }} animate={{ scale: [0.96, 1.02, 0.99] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="relative">
                <div className="absolute -inset-0 rounded-full pointer-events-none" />
                <motion.div whileHover={{ scale: 1.05 }} className="relative">
                  <div className="w-32 h-32 rounded-full bg-white/60 flex items-center justify-center text-4xl font-bold text-red-600 shadow-lg overflow-hidden">
                    {profile?.avatar ? <img src={profile.avatar} alt="avatar" className="w-full h-full object-cover" /> : <span>{(profile?.name || "U")[0].toUpperCase()}</span>}
                  </div>
                  <motion.span className="absolute -inset-1 rounded-full" style={{ boxShadow: "0 8px 30px rgba(239,68,68,0.18)" }} animate={{ boxShadow: ["0 8px 30px rgba(239,68,68,0.08)", "0 14px 40px rgba(239,68,68,0.18)", "0 8px 30px rgba(239,68,68,0.08)"] }} transition={{ duration: 2.2, repeat: Infinity }} />
                </motion.div>
              </motion.div>

              <motion.h2 initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="mt-6 text-2xl font-extrabold text-gray-800">
                {profile?.name || "Unknown User"}
              </motion.h2>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.45 }} className="mt-2 text-sm text-gray-500 flex items-center gap-2">
                {profile?.email || "—"}
              </motion.p>

              <div className="mt-6 w-full grid grid-cols-3 gap-3">
                {/* Bookings: show only if KYC status done or pending, else show blank */}
                <div className="flex flex-col items-center p-3 bg-white/50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">{kycShowsBookings ? bookingsCountAnim : "-"}</div>
                  <div className="text-xs text-gray-500">Bookings</div>
                </div>

                {/* Spaces: show only for sellers */}
                <div className="flex flex-col items-center p-3 bg-white/50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">{isSeller ? spacesCountAnim : "-"}</div>
                  <div className="text-xs text-gray-500">Spaces</div>
                </div>

                {/* Rating: seller only */}
                <div className="flex flex-col items-center p-3 bg-white/50 rounded-lg">
                  <div className="text-lg font-bold text-gray-800">{isSeller ? ((ratingCountAnim / 10).toFixed(1)) : "-"}</div>
                  <div className="text-xs text-gray-500">Rating</div>
                </div>
              </div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="mt-6 text-sm text-gray-500">
                {profile?.bio || "Add a short bio to let others know more about you."}
              </motion.div>

              {/* Removed Message / Follow buttons per request */}
              <div className="mt-6 w-full flex gap-3 justify-center">
                {/* optionally show KYC status */}
                <div className="text-sm text-gray-500">
                  KYC: <span className={`font-medium ${((profile?.kycData?.status || "").toLowerCase() === "done") ? "text-green-600" : ((profile?.kycData?.status || "").toLowerCase() === "pending" ? "text-yellow-600" : "text-gray-400")}`}>
                    {profile?.kycData?.status ? profile.kycData.status : (profile?.kycData?.verified ? "done" : "not done")}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Content area (tabs + spaces listing for seller) */}
          <div className="col-span-1 lg:col-span-2">
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="bg-white/70 backdrop-blur-md border border-white/40 rounded-2xl p-6 shadow-xl">
              <div className="flex items-center justify-between">
                <div className="flex gap-2 items-center">
                  <TabButton active={tab === "Profile"} onClick={() => setTab("Profile")}>Profile</TabButton>
                  {/* Only show My Spaces tab for sellers */}
                  {isSeller && <TabButton active={tab === "Spaces"} onClick={() => setTab("Spaces")}>My Spaces</TabButton>}
                </div>
                <div className="text-sm text-gray-500">Last updated: {profile?.updatedAt ? new Date(profile.updatedAt).toLocaleString() : "—"}</div>
              </div>

              <div className="mt-6">
                <AnimatePresence mode="wait">
                  {tab === "Profile" && (
                    <motion.div key="profile" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
                      <ProfileDetails profile={profile} />
                    </motion.div>
                  )}

                  {tab === "Spaces" && isSeller && (
                    <motion.div key="spaces" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} transition={{ duration: 0.35 }}>
                      <Suspense fallback={<div className="p-8">Loading spaces…</div>}>
                        {/* ProviderSpaces component should render seller's spaces. If missing, add a small stub to avoid crash */}
                        <LazyProviderSpaces />
                      </Suspense>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* Small helper components */

function StatCard({ label, value, suffix = "" }: { label: string; value: any; suffix?: string }) {
  return (
    <div className="flex flex-col items-center p-3 bg-white/50 rounded-lg">
      <div className="text-lg font-bold text-gray-800">{value}{suffix}</div>
      <div className="text-xs text-gray-500">{label}</div>
    </div>
  );
}

function TabButton({ children, active = false, onClick }: any) {
  return (
    <button onClick={onClick} className={`px-4 py-2 rounded-full text-sm font-medium ${active ? "bg-red-600 text-white shadow-md" : "bg-white/60 text-gray-700 hover:bg-white"}`}>
      {children}
    </button>
  );
}

function ProfileDetails({ profile }: { profile: any }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <h3 className="text-sm font-medium text-gray-600">Contact</h3>
        <div className="mt-3 text-gray-700 text-sm">
          <div className="flex items-center gap-2"><strong className="w-24">Email</strong> <span>{profile?.email || "-"}</span></div>
          <div className="flex items-center gap-2 mt-2"><strong className="w-24">Phone</strong> <span>{profile?.kycData?.phoneNumber || "-"}</span></div>
          <div className="flex items-center gap-2 mt-2"><strong className="w-24">Address</strong> <span>{profile?.kycData?.address || profile?.address || "-"}</span></div>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium text-gray-600">KYC / Identity</h3>
        <div className="mt-3 text-gray-700 text-sm">
          <div className="mt-2">Full name: {profile?.kycData?.fullName || "-"}</div>
          <div className="mt-2">City: {profile?.kycData?.city || "-"}</div>
          <div className="mt-2">Country: {profile?.kycData?.country || "-"}</div>
        </div>
      </div>
    </div>
  );
}
