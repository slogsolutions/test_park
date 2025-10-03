// src/components/bookings/MyBookings.tsx
import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import io from "socket.io-client";
import {
  FaMapMarkerAlt,
  FaRegCalendarAlt,
  FaCheckCircle,
  FaMoneyBillWave,
  FaTimesCircle,
  FaCreditCard,
  FaClipboard,
} from "react-icons/fa";
import LoadingScreen from "../../pages/LoadingScreen";

type Booking = {
  _id: string;
  parkingSpace: any | null;
  startTime?: string | null;
  endTime?: string | null;
  status?: string;
  paymentStatus?: string;
  totalPrice?: number;
  priceParking?: number;
  pricePerHour?: number;
  secondOtp?: string | null;
  secondOtpExpires?: string | null;
  otp?: string | null;
  otpExpires?: string | null;
};

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL ?? window.location.origin;
const API_BASE = import.meta.env.VITE_BASE_URL ?? "";

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();
  const socketRef = useRef<any>(null);

  // store OTPs generated/returned by server keyed by bookingId
  const [generatedOtps, setGeneratedOtps] = useState<Record<string, { otp: string; expiresAt?: string }>>({});

  useEffect(() => {
    let mounted = true;

    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${API_BASE}/api/booking/my-bookings`, {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
        });
        if (mounted) setBookings(response.data || []);
      } catch (err) {
        console.error("fetchBookings error:", err);
        if (mounted) setError("Failed to fetch bookings");
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchBookings();

    // init socket.io and handlers
    try {
      socketRef.current = io(SOCKET_URL, { autoConnect: true });

      socketRef.current.on("connect", () => {
        console.log("socket connected", socketRef.current.id);
      });

      // booking-updated: payload { booking }
      socketRef.current.on("booking-updated", (payload: any) => {
        try {
          const updated = payload?.booking ?? payload;
          if (!updated || !updated._id) return;
          setBookings((prev) => prev.map((b) => (b._id === updated._id ? { ...b, ...updated } : b)));
          // if server returned a secondOtp in broadcast, show it
          if (updated.secondOtp) {
            setGeneratedOtps((prev) => ({ ...prev, [updated._id]: { otp: updated.secondOtp, expiresAt: updated.secondOtpExpires } }));
          }
        } catch (e) {
          console.warn("booking-updated handler error", e);
        }
      });

      // booking-overdue: payload { bookingId }
      socketRef.current.on("booking-overdue", (payload: any) => {
        if (!payload) return;
        const id = payload.bookingId ?? payload._id;
        if (!id) return;
        setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "overdue" } : b)));
      });

      // booking-completed
      socketRef.current.on("booking-completed", (payload: any) => {
        if (!payload) return;
        const id = payload.bookingId ?? payload._id;
        if (!id) return;
        setBookings((prev) => prev.map((b) => (b._id === id ? { ...b, status: "completed" } : b)));
      });
    } catch (e) {
      console.warn("socket init failed", e);
    }

    return () => {
      mounted = false;
      try {
        if (socketRef.current) socketRef.current.disconnect();
      } catch (e) {}
    };
  }, []);

  // ---------------- helpers ----------------
  const loadRazorpayScript = async () =>
    new Promise((resolve, reject) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay script"));
      document.body.appendChild(script);
    });

  const requestOTPFromServer = async (bookingId: string) => {
    const token = localStorage.getItem("token");
    const response = await axios.post(
      `${API_BASE}/api/booking/${bookingId}/generate-otp`,
      {},
      { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } }
    );
    return response.data;
  };

  const computePriceMeta = (space: any) => {
    const baseRaw = space?.priceParking ?? space?.price ?? space?.pricePerHour ?? 0;
    const base = Number(baseRaw) || 0;
    let rawDiscount = space?.discount ?? space?.discountPercent ?? space?.discount_percentage ?? 0;
    if (typeof rawDiscount === "string") rawDiscount = rawDiscount.replace?.("%", "") ?? rawDiscount;
    if (typeof rawDiscount === "object" && rawDiscount !== null) {
      rawDiscount = rawDiscount.percent ?? rawDiscount.value ?? rawDiscount.amount ?? 0;
    }
    const discountNum = Number(rawDiscount);
    const discountPercent = Number.isFinite(discountNum) ? Math.max(0, Math.min(100, discountNum)) : 0;
    return { basePrice: +base.toFixed(2), discountPercent, hasDiscount: discountPercent > 0 };
  };

  const getHoursDuration = (startISO?: string | null, endISO?: string | null) => {
    try {
      if (!startISO || !endISO) return 0;
      const start = new Date(startISO).getTime();
      const end = new Date(endISO).getTime();
      if (isNaN(start) || isNaN(end) || end <= start) return 0;
      const ms = end - start;
      return ms / (1000 * 60 * 60);
    } catch {
      return 0;
    }
  };

  const computeTotalsForBooking = (booking: Booking) => {
    const space = booking.parkingSpace ?? {};
    const meta = computePriceMeta(space);
    const perHour = Number(booking.priceParking ?? booking.pricePerHour ?? meta.basePrice ?? 0) || 0;
    const hours = getHoursDuration(booking.startTime, booking.endTime) || 0;
    const effectiveHours = hours > 0 ? hours : 1;
    const originalTotal = +(perHour * effectiveHours);
    const discountedTotal = +(originalTotal * (1 - (meta.discountPercent / 100)));
    return {
      perHour,
      hours: effectiveHours,
      originalTotal: +originalTotal.toFixed(2),
      discountedTotal: +discountedTotal.toFixed(2),
      discountPercent: meta.discountPercent,
      hasDiscount: meta.hasDiscount,
    };
  };

  // allow entering primary OTP 15 minutes before start
  const canEnterOtp = (booking: Booking) => {
    if (!booking.startTime) return false;
    const startTs = new Date(booking.startTime).getTime();
    if (isNaN(startTs)) return false;
    return Date.now() >= startTs - 15 * 60 * 1000;
  };

  // ---------------- actions ----------------
  const handleCancelBooking = async (bookingId: string) => {
    try {
      await axios.delete(`${API_BASE}/api/booking/${bookingId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
      });
      setBookings((prev) => prev.filter((b) => b._id !== bookingId));
      alert("Booking cancelled successfully");
    } catch (err) {
      console.error("cancel booking error:", err);
      alert("Failed to cancel booking");
    }
  };

  const handlePayNow = async (bookingId: string, amountInRupees: number) => {
    try {
      await loadRazorpayScript();
      const amountInPaise = Math.round(Number(amountInRupees) * 100);

      const { data: paymentData } = await axios.post(
        `${API_BASE}/api/payment/initiate-payment`,
        { bookingId, amount: amountInPaise, isPaise: true },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const options = {
        key: "rzp_test_eQoJ7XZxUf37D7",
        amount: paymentData.amount,
        currency: "INR",
        order_id: paymentData.orderId,
        handler: async (response: any) => {
          try {
            const verifyResp = await axios.post(
              `${API_BASE}/api/payment/verify-payment`,
              {
                bookingId,
                razorpay_order_id: paymentData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                extend: false,
                isPaise: true,
              },
              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            alert("Payment successful!");
            // server will emit booking-updated; optimistic update only for quick UI feedback:
            setBookings((prev) => prev.map((b) => (b._id === bookingId ? { ...b, paymentStatus: "paid" } : b)));

            // if server returned OTP (rare for plain pay), keep it
            const otpObj = verifyResp?.data?.otp;
            if (otpObj?.otp) {
              setGeneratedOtps((prev) => ({ ...prev, [bookingId]: { otp: otpObj.otp, expiresAt: otpObj.expiresAt } }));
            }
          } catch (e) {
            console.error(e);
            alert("Payment verification failed");
          }
        },
        prefill: { name: "Parking Space", email: "customer@example.com", contact: "9999999999" },
        theme: { color: "#FFC107" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("handlePayNow error:", err);
      alert("Failed to initiate payment");
    }
  };

  const handleExtendAndPay = async (booking: Booking) => {
    try {
      const totals = computeTotalsForBooking(booking);
      const amountRupees = Number(totals.perHour || 0);
      await loadRazorpayScript();
      const amountInPaise = Math.round(amountRupees * 100);

      const { data: paymentData } = await axios.post(
        `${API_BASE}/api/payment/initiate-payment`,
        { bookingId: booking._id, amount: amountInPaise, extend: true, isPaise: true },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const options = {
        key: "rzp_test_eQoJ7XZxUf37D7",
        amount: paymentData.amount,
        currency: "INR",
        order_id: paymentData.orderId,
        handler: async (response: any) => {
          try {
            const verifyResp = await axios.post(
              `${API_BASE}/api/payment/verify-payment`,
              {
                bookingId: booking._id,
                razorpay_order_id: paymentData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                extend: true,
                isPaise: true,
              },
              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            // optimistic local update of endTime while waiting for server emit:
            const originalEndTs = booking.endTime ? new Date(booking.endTime).getTime() : Date.now();
            const newEnd = new Date(originalEndTs + 60 * 60 * 1000);
            setBookings((prev) => prev.map((b) => (b._id === booking._id ? { ...b, endTime: newEnd.toISOString(), paymentStatus: "paid" } : b)));

            // server will emit booking-updated with authoritative version; if verifyResp returns updated booking use it
            if (verifyResp?.data?.booking) {
              const returned = verifyResp.data.booking;
              setBookings((prev) => prev.map((b) => (b._id === returned._id ? returned : b)));
            }

            alert("Extension payment successful — booking extended by 1 hour.");

            // extension does not generate a checkout (second) OTP. If server returns any OTP, show it.
            const maybeOtp = verifyResp?.data?.otp;
            if (maybeOtp?.otp) {
              setGeneratedOtps((prev) => ({ ...prev, [booking._id]: { otp: maybeOtp.otp, expiresAt: maybeOtp.expiresAt } }));
              navigate("/track", { state: { parkingSpace: booking.parkingSpace, otp: maybeOtp.otp, bookingId: booking._id, expiresAt: maybeOtp.expiresAt } });
              return;
            }
          } catch (e) {
            console.error("Extension payment verification failed", e);
            alert("Extension payment verification failed");
          }
        },
        prefill: { name: "Parking Space", email: "customer@example.com", contact: "9999999999" },
        theme: { color: "#FFC107" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("handleExtendAndPay error:", err);
      alert("Failed to create extension payment. Please try again.");
    }
  };

  // Pay fine flow:
  // - calls /initiate-payment and /verify-payment with fine=true
  // - server will increment totalPrice and generate secondOtp (checkout OTP)
  // - server should NOT complete booking automatically; provider must verify secondOtp to complete
  const handlePayFine = async (booking: Booking) => {
    try {
      // compute fine: overdue hours * (0.5 * perHour or booking.totalPrice)
      const now = Date.now();
      const endTs = booking.endTime ? new Date(booking.endTime).getTime() : now;
      const overdueMs = Math.max(0, now - endTs);
      const overdueHours = Math.max(1, Math.ceil(overdueMs / (1000 * 60 * 60)));

      const totals = computeTotalsForBooking(booking);
      const fallbackPerHour = totals.perHour || 0;
      const bookingTotalPrice = Number(booking.totalPrice ?? 0);
      const fineAmount = overdueHours * 0.5 * (bookingTotalPrice > 0 ? bookingTotalPrice : fallbackPerHour);
      const fineInPaise = Math.round(fineAmount * 100);

      await loadRazorpayScript();

      const { data: paymentData } = await axios.post(
        `${API_BASE}/api/payment/initiate-payment`,
        { bookingId: booking._id, amount: fineInPaise, isPaise: true, fine: true },
        { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
      );

      const options = {
        key: "rzp_test_eQoJ7XZxUf37D7",
        amount: paymentData.amount,
        currency: "INR",
        order_id: paymentData.orderId,
        handler: async (response: any) => {
          try {
            const verifyResp = await axios.post(
              `${API_BASE}/api/payment/verify-payment`,
              {
                bookingId: booking._id,
                razorpay_order_id: paymentData.orderId,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                extend: false,
                isPaise: true,
                fine: true,
              },
              { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
            );

            // server returns updated booking (if any) and otp object if generated
            const returnedBooking = verifyResp?.data?.booking;
            const returnedOtpObj = verifyResp?.data?.otp;

            if (returnedBooking) {
              setBookings((prev) => prev.map((b) => (b._id === returnedBooking._id ? returnedBooking : b)));
            } else {
              // If server didn't return booking, just mark paymentStatus=paid (do NOT change endTime)
              setBookings((prev) => prev.map((b) => (b._id === booking._id ? { ...b, paymentStatus: "paid" } : b)));
            }

            if (returnedOtpObj?.otp) {
              setGeneratedOtps((prev) => ({ ...prev, [booking._id]: { otp: returnedOtpObj.otp, expiresAt: returnedOtpObj.expiresAt } }));
              alert(`Fine paid. Checkout OTP generated: ${returnedOtpObj.otp}. Provide this to provider to checkout.`);
              // Do NOT auto-complete booking — provider must verify second OTP via provider UI/API
              return;
            }

            // fallback: ask server to explicitly generate OTP (shouldn't normally be needed)
            try {
              const otpRes = await requestOTPFromServer(booking._id);
              setGeneratedOtps((prev) => ({ ...prev, [booking._id]: { otp: otpRes.otp, expiresAt: otpRes.expiresAt } }));
              alert(`Fine paid. Checkout OTP generated: ${otpRes.otp}. Provide this to provider to checkout.`);
            } catch (otpErr) {
              console.error("Failed to generate OTP after fine payment", otpErr);
              alert("Fine paid but failed to generate checkout OTP. Contact provider/admin.");
            }
          } catch (e) {
            console.error("Fine payment verification failed", e);
            alert("Fine payment verification failed");
          }
        },
        prefill: { name: "Parking Space", email: "customer@example.com", contact: "9999999999" },
        theme: { color: "#FFC107" },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch (err) {
      console.error("handlePayFine error:", err);
      alert("Failed to initiate fine payment. Try again.");
    }
  };

  const handleGenerateOtpForCompletion = async (booking: Booking) => {
    try {
      const res = await requestOTPFromServer(booking._id);
      // server returns either primary OTP (for checkin) or second OTP (for checkout)
      setGeneratedOtps((prev) => ({ ...prev, [booking._id]: { otp: res.otp, expiresAt: res.expiresAt } }));
    } catch (err) {
      console.error("Failed to generate OTP", err);
      alert("Failed to generate OTP. Try again.");
    }
  };

  const handleTrackNow = async (booking: Booking) => {
    try {
      const res = await requestOTPFromServer(booking._id);
      navigate("/track", {
        state: {
          parkingSpace: booking.parkingSpace,
          otp: res.otp,
          bookingId: booking._id,
          expiresAt: res.expiresAt,
        },
      });
    } catch (e) {
      console.error("handleTrackNow error:", e);
      alert("Failed to generate OTP. Try again.");
    }
  };

  const statusLabel = (s?: string) => {
    switch (s) {
      case "pending":
        return { label: "Pending", color: "text-yellow-600", iconGreen: false };
      case "accepted":
        return { label: "Accepted", color: "text-green-600", iconGreen: true };
      case "confirmed":
        return { label: "Confirmed", color: "text-blue-600", iconGreen: true };
      case "active":
        return { label: "Active", color: "text-green-600", iconGreen: true };
      case "overdue":
        return { label: "Overdue", color: "text-red-600", iconGreen: false };
      case "rejected":
        return { label: "Rejected", color: "text-red-600", iconGreen: false };
      case "completed":
        return { label: "Completed", color: "text-gray-600", iconGreen: true };
      default:
        return { label: s ?? "Unknown", color: "text-gray-600", iconGreen: false };
    }
  };

  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
        <LoadingScreen />
      </div>
    );
  }
  if (error) {
    return <p>{error}</p>;
  }

  // ---------------- render ----------------
  return (
    <div className="max-w-4xl mx-auto mb-40 p-6 bg-gradient-to-r shadow-xl rounded-xl">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Your Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-center text-gray-500">You don't have any bookings.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {bookings.map((booking) => {
            const st = statusLabel(booking.status);
            const now = Date.now();
            const endTs = booking.endTime ? new Date(booking.endTime).getTime() : NaN;
            const isActive = booking.status === "active";
            const beforeEnd = !isNaN(endTs) ? now < endTs : false;
            const afterOrAtEnd = !isNaN(endTs) ? now >= endTs : false;

            const totals = computeTotalsForBooking(booking);
            const perHour = totals.perHour;
            const extensionAmount = Math.ceil(perHour);
            const generated = generatedOtps[booking._id] ?? (booking.secondOtp ? { otp: booking.secondOtp, expiresAt: booking.secondOtpExpires } : undefined);
            const payableStatuses = ["pending", "accepted", "confirmed"];
            const showPayNow = booking.paymentStatus === "pending" && payableStatuses.includes(booking.status);

            const overdueMs = Math.max(0, (isNaN(endTs) ? 0 : now - endTs));
            const overdueHours = overdueMs > 0 ? Math.ceil(overdueMs / (1000 * 60 * 60)) : 0;
            const bookingTotalPrice = Number(booking.totalPrice ?? 0);
            const previewFine = overdueHours > 0 ? overdueHours * 0.5 * (bookingTotalPrice > 0 ? bookingTotalPrice : perHour) : 0;

            return (
              <div key={booking._id} className="p-5 bg-white rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105">
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaMapMarkerAlt className="mr-2 text-red-500" />
                  {booking.parkingSpace?.title || "N/A"}
                </h3>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <FaRegCalendarAlt className="mr-2 text-red-500" />
                    <span>Start Time: </span>
                    <span className="ml-2">{booking.startTime ? new Date(booking.startTime).toLocaleString() : "N/A"}</span>
                  </li>
                  <li className="flex items-center">
                    <FaRegCalendarAlt className="mr-2 text-red-500" />
                    <span>End Time: </span>
                    <span className="ml-2">{booking.endTime ? new Date(booking.endTime).toLocaleString() : "N/A"}</span>
                  </li>
                  <li className="flex items-center">
                    {st.iconGreen ? <FaCheckCircle className={`mr-2 ${st.color}`} /> : <FaTimesCircle className={`mr-2 ${st.color}`} />}
                    <span>Status: </span>
                    <span className={`${st.color} font-semibold ml-2`}>{st.label}</span>
                  </li>

                  <li className="flex items-center">
                    <FaMoneyBillWave className="mr-2 text-green-600" />
                    <span>Total Price: </span>
                    <div className="ml-2">
                      {totals.hasDiscount ? (
                        <div className="flex flex-col">
                          <div className="text-sm text-gray-400 line-through">₹{totals.originalTotal.toFixed(2)}</div>
                          <div className="text-lg font-bold text-green-700">₹{totals.discountedTotal.toFixed(2)}</div>
                          <div className="text-xs text-white inline-block mt-1 bg-green-500 px-2 py-0.5 rounded">{totals.discountPercent}% OFF</div>
                        </div>
                      ) : (
                        <div className="text-lg font-semibold">₹{totals.originalTotal.toFixed(2)}</div>
                      )}
                    </div>
                  </li>
                </ul>

                <div className="mt-4 flex flex-col gap-3">
                  {booking.status === "pending" && (
                    <button onClick={() => handleCancelBooking(booking._id)} className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-red-600 transition duration-300 transform hover:scale-105">
                      <FaTimesCircle className="text-xl" />
                      <span className="ml-2">Cancel</span>
                    </button>
                  )}

                  {showPayNow && (
                    <button onClick={() => handlePayNow(booking._id, totals.discountedTotal)} className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-yellow-600 transition duration-300 transform hover:scale-105">
                      <FaCreditCard className="text-xl" />
                      <span className="ml-2">Pay Now</span>
                    </button>
                  )}

                  {/* Active session flows */}
                  {isActive && (
                    <>
                      {/* before scheduled end: show checkout & track and extend option */}
                      {beforeEnd && (
                        <div className="flex flex-col gap-2">
                          <div className="flex gap-2">
                            <button onClick={() => handleGenerateOtpForCompletion(booking)} className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex-1 hover:bg-green-700 transition">Check Out</button>
                            <button onClick={() => handleTrackNow(booking)} className="bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition">Track</button>
                          </div>

                          {/* Extend button visible while active (user requested this) */}
                          <div>
                            <button onClick={() => handleExtendAndPay(booking)} className="bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-700 transition">Extend & Pay 1 hr — ₹{extensionAmount}</button>
                          </div>
                        </div>
                      )}

                      {/* after or at end: if overdueHours>0 => pay fine; else if no overdueHours (rare) show extend */}
                      {afterOrAtEnd && (
                        <>
                          {overdueHours > 0 ? (
                            <div className="flex flex-col gap-2">
                              <button disabled className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg flex-1 cursor-not-allowed" title="Complete is disabled after end time; pay fine to resume session">Check Out Time over</button>

                              <div className="flex gap-2 items-center">
                                <button onClick={() => handlePayFine(booking)} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition flex-1">Pay Fine ₹{previewFine.toFixed(2)}</button>
                                <div className="text-sm text-gray-500">Overdue: {overdueHours} hr{overdueHours > 1 ? "s" : ""}</div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex gap-2">
                              <button disabled className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg flex-1 cursor-not-allowed" title="Complete is disabled after end time; extend and pay to continue session">Check Out Time over</button>
                              <button onClick={() => handleExtendAndPay(booking)} className="bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-700 transition">Extend & Pay 1 hr — ₹{extensionAmount}</button>
                            </div>
                          )}
                        </>
                      )}

                      {/* show generated/returned OTP for user (if server gave secondOtp after fine or user requested) */}
                      {generated && (
                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-500">Checkout OTP (give to provider)</div>
                              <div className="font-mono text-lg font-semibold">{generated.otp}</div>
                              {generated.expiresAt && <div className="text-xs text-gray-500">Expires: {new Date(generated.expiresAt).toLocaleString()}</div>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button onClick={() => { navigator.clipboard?.writeText(generated.otp); alert("OTP copied to clipboard"); }} className="px-3 py-1 bg-blue-600 text-white rounded" title="Copy OTP"><FaClipboard /></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* If server-marked overdue (not active) show single Pay Fine control (no duplicate) */}
                  {booking.status === "overdue" && (
                    <>
                      <div>
                        <button onClick={() => handlePayFine(booking)} className="bg-red-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-red-700 transition duration-300 transform hover:scale-105">Pay Fine ₹{previewFine.toFixed(2)}</button>
                        <div className="text-sm text-gray-500 mt-1">Overdue: {overdueHours} hr{overdueHours > 1 ? "s" : ""}</div>
                      </div>

                      {/* If server already generated a secondOtp (maybe returned on payment verify) show it */}
                      {generated && (
                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-500">Checkout OTP (give to provider)</div>
                              <div className="font-mono text-lg font-semibold">{generated.otp}</div>
                              {generated.expiresAt && <div className="text-xs text-gray-500">Expires: {new Date(generated.expiresAt).toLocaleString()}</div>}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button onClick={() => { navigator.clipboard?.writeText(generated.otp); alert("OTP copied to clipboard"); }} className="px-3 py-1 bg-blue-600 text-white rounded" title="Copy OTP"><FaClipboard /></button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* When paid but not completed and not active (e.g. confirmed/accepted paid) allow Track */}
                  {booking.paymentStatus === "paid" && booking.status !== "completed" && !isActive && (
                    <div>
                      <button onClick={() => handleTrackNow(booking)} className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 transform hover:scale-105">Track Now</button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
