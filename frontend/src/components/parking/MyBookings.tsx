// // frontend/src/components/parking/MyBookings.tsx
// import React, { useState, useEffect } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom";
// import { FaMapMarkerAlt, FaRegCalendarAlt, FaCheckCircle, FaMoneyBillWave, FaTimesCircle, FaCreditCard } from "react-icons/fa";
// import LoadingScreen from "../../pages/LoadingScreen";

// type Booking = {
//   _id: string;
//   parkingSpace: any | null;
//   startTime: string;
//   endTime: string;
//   status: string;
//   paymentStatus: string;
//   totalPrice: number;
//   pricePerHour?: number;
// };

// const MyBookings: React.FC = () => {
//   const [bookings, setBookings] = useState<Booking[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState("");
//   const navigate = useNavigate();

//   useEffect(() => {
//     const fetchBookings = async () => {
//       try {
//         const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/my-bookings`, {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         });
//         setBookings(response.data);
//       } catch (err) {
//         setError("Failed to fetch bookings");
//         console.error("fetchBookings error:", err);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchBookings();
//   }, []);

//   const handleCancelBooking = async (bookingId: string) => {
//     try {
//       await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/booking/${bookingId}`, {
//         headers: {
//           Authorization: `Bearer ${localStorage.getItem("token")}`,
//         },
//       });

//       setBookings((prevBookings) =>
//         prevBookings.filter((booking) => booking._id !== bookingId)
//       );
//       alert("Booking cancelled successfully");
//     } catch (err) {
//       console.error("cancel booking error:", err);
//       alert("Failed to cancel booking");
//     }
//   };

//   const loadRazorpayScript = async () => {
//     return new Promise((resolve, reject) => {
//       const script = document.createElement("script");
//       script.src = "https://checkout.razorpay.com/v1/checkout.js";
//       script.onload = () => resolve(true);
//       script.onerror = () => reject(new Error("Failed to load Razorpay script"));
//       document.body.appendChild(script);
//     });
//   };

//   // Request OTP from server
//   const requestOTPFromServer = async (bookingId: string) => {
//     try {
//       const token = localStorage.getItem('token');
//       const response = await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/api/booking/${bookingId}/generate-otp`,
//         {},
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//             'Content-Type': 'application/json',
//           },
//         }
//       );
//       return response.data;
//     } catch (err: any) {
//       console.error('Failed to request OTP', err);
//       throw err;
//     }
//   };

//   const handlePayNow = async (bookingId: string, amount: number) => {
//     try {
//       await loadRazorpayScript();

//       const { data: paymentData } = await axios.post(
//         `${import.meta.env.VITE_BASE_URL}/api/payment/initiate-payment`,
//         { bookingId, amount },
//         {
//           headers: {
//             Authorization: `Bearer ${localStorage.getItem("token")}`,
//           },
//         }
//       );

//       const options = {
//         key: "rzp_test_eQoJ7XZxUf37D7",
//         amount: paymentData.amount,
//         currency: "INR",
//         order_id: paymentData.orderId,
//         handler: async (response: any) => {
//           try {
//             await axios.post(
//               `${import.meta.env.VITE_BASE_URL}/api/payment/verify-payment`,
//               {
//                 bookingId,
//                 razorpay_order_id: paymentData.orderId,
//                 razorpay_payment_id: response.razorpay_payment_id,
//                 razorpay_signature: response.razorpay_signature,
//               },
//               {
//                 headers: {
//                   Authorization: `Bearer ${localStorage.getItem("token")}`,
//                 },
//               }
//             );

//             alert("Payment successful!");
//             // Refresh the bookings so UI is in-sync with backend
//             setBookings((prevBookings) =>
//               prevBookings.map((booking) =>
//                 booking._id === bookingId
//                   ? { ...booking, paymentStatus: "paid" }
//                   : booking
//               )
//             );
//           } catch (e) {
//             console.log(e);
//             alert("Payment verification failed");
//           }
//         },
//         prefill: {
//           name: "Parking Space",
//           email: "customer@example.com",
//           contact: "9999999999",
//         },
//         theme: {
//           color: "#FFC107",
//         },
//       };

//       const razorpay = new (window as any).Razorpay(options);
//       razorpay.open();
//     } catch (err) {
//       console.error("handlePayNow error:", err);
//       alert("Failed to initiate payment");
//     }
//   };

//   // const handleTrackNow = async (booking: Booking) => {
//   //   try {
//   //     const res = await requestOTPFromServer(booking._id);
//   //     // Navigate and pass OTP to track page (buyer will see OTP)
//   //     navigate("/track", { 
//   //       state: { 
//   //         parkingSpace: booking.parkingSpace, 
//   //         otp: res.otp, 
//   //         bookingId: booking._id,
//   //         expiresAt: res.expiresAt
//   //       } 
//   //     });
//   //   } catch (e) {
//   //     console.error("handleTrackNow error:", e);
//   //     alert('Failed to generate OTP. Try again.');
//   //   }
//   // };
//       const handleTrackNow = async (booking: Booking) => {
//       try {
//         const res = await requestOTPFromServer(booking._id);
//         // Pass bookingId for polling updates
//         navigate("/track", { 
//           state: { 
//             bookingId: booking._id,
//             parkingSpace: booking.parkingSpace, 
//             firstOtp: res.otp,
//             expiresAt: res.expiresAt
//           } 
//         });
//       } catch (e) {
//         console.error("handleTrackNow error:", e);
//         alert('Failed to generate OTP. Try again.');
//       }
//     };

//   const statusLabel = (s: string) => {
//     switch (s) {
//       case 'pending': return { label: 'Pending', color: 'text-yellow-600', iconGreen: false };
//       case 'accepted': return { label: 'Accepted', color: 'text-green-600', iconGreen: true };
//       case 'confirmed': return { label: 'Confirmed', color: 'text-blue-600', iconGreen: true };
//       case 'active': return { label: 'Active', color: 'text-green-600', iconGreen: true };
//       case 'rejected': return { label: 'Rejected', color: 'text-red-600', iconGreen: false };
//       case 'completed': return { label: 'Completed', color: 'text-gray-600', iconGreen: true };
//       default: return { label: s, color: 'text-gray-600', iconGreen: false };
//     }
//   };

//   if (loading) {
//     return (
//       <div className="h-[calc(100vh-64px)] flex items-center justify-center">
//        <LoadingScreen/>
//       </div>
//     );
//   }
//   if (error) {
//     return <p>{error}</p>;
//   }

//   return (
//     <div className="max-w-4xl mx-auto  mb-40 p-6 bg-gradient-to-r  shadow-xl rounded-xl">
//       <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Your Bookings</h2>
//       {bookings.length === 0 ? (
//         <p className="text-center text-gray-500">You don't have any bookings.</p>
//       ) : (
//         <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
//           {bookings.map((booking) => {
//             const st = statusLabel(booking.status);
//             // Decide whether Pay button should appear:
//             // show Pay if payment is pending and booking is in a payable state (pending|accepted|confirmed)
//             const payableStatuses = ['pending', 'accepted', 'confirmed'];
//             const showPayNow = booking.paymentStatus === "pending" && payableStatuses.includes(booking.status);

//             return (
//               <div
//                 key={booking._id}
//                 className="p-5 bg-white rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105"
//               >
//                 <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
//                   <FaMapMarkerAlt className="mr-2 text-red-500" />
//                   {booking.parkingSpace?.title || "N/A"}
//                 </h3>
//                 <ul className="text-gray-600 space-y-2">
//                   <li className="flex items-center">
//                     <FaRegCalendarAlt className="mr-2 text-red-500" />
//                     <span>Start Time: </span>
//                     <span className="ml-2">{new Date(booking.startTime).toLocaleString()}</span>
//                   </li>
//                   <li className="flex items-center">
//                     <FaRegCalendarAlt className="mr-2 text-red-500" />
//                     <span>End Time: </span>
//                     <span className="ml-2">{new Date(booking.endTime).toLocaleString()}</span>
//                   </li>
//                   <li className="flex items-center">
//                     {st.iconGreen ? (
//                       <FaCheckCircle className={`mr-2 ${st.color}`} />
//                     ) : (
//                       <FaTimesCircle className={`mr-2 ${st.color}`} />
//                     )}
//                     <span>Status: </span>
//                     <span className={`${st.color} font-semibold ml-2`}>{st.label}</span>
//                   </li>
//                   <li className="flex items-center">
//                     <FaMoneyBillWave className="mr-2 text-green-600" />
//                     <span>Total Price: </span>
//                     <span className="ml-2">₹{Math.ceil(booking.totalPrice)}</span>
//                   </li>
//                 </ul>
//                 <div className="mt-4 flex  space-x-4">
//                   {booking.status === "pending" && (
//                     <button
//                       onClick={() => handleCancelBooking(booking._id)}
//                       className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-red-600 transition duration-300 transform hover:scale-105"
//                     >
//                       <FaTimesCircle className="text-xl" />
//                       <span className="ml-2">Cancel</span>
//                     </button>
//                   )}
//                   {showPayNow && (
//                     <button
//                       onClick={() => handlePayNow(booking._id, Math.ceil(booking.totalPrice))}
//                       className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-yellow-600 transition duration-300 transform hover:scale-105"
//                     >
//                       <FaCreditCard className="text-xl" />
//                       <span className="ml-2">Pay Now</span>
//                     </button>
//                   )}
//                 </div>
//                 {booking.paymentStatus === "paid" && (
//                   <div className="mt-4 ">
//                     <button
//                       onClick={() => handleTrackNow(booking)}
//                       className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 transform hover:scale-105"
//                     >
//                       Track Now
//                     </button>
//                   </div>
//                 )}
//               </div>
//             );
//           })}
//         </div>
//       )}
//     </div>
//   );
// };

// export default MyBookings;






import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaRegCalendarAlt, FaCheckCircle, FaMoneyBillWave, FaTimesCircle, FaCreditCard, FaClipboard } from "react-icons/fa";
import LoadingScreen from "../../pages/LoadingScreen";

type Booking = {
  _id: string;
  parkingSpace: any | null;
  startTime: string;
  endTime: string;
  endTime?: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
  priceParking?: number;
};

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  // store generated OTPs for bookings (so buyer can see/copy)
  const [generatedOtps, setGeneratedOtps] = useState<Record<string, { otp: string; expiresAt?: string }>>({});

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/my-bookings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setBookings(response.data || []);
      } catch (err) {
        setError("Failed to fetch bookings");
        console.error("fetchBookings error:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchBookings();
  }, []);

  const handleCancelBooking = async (bookingId: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/booking/${bookingId}`, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });

      setBookings((prevBookings) => prevBookings.filter((booking) => booking._id !== bookingId));
      alert("Booking cancelled successfully");
    } catch (err) {
      console.error("cancel booking error:", err);
      alert("Failed to cancel booking");
    }
  };

  const loadRazorpayScript = async () => {
    return new Promise((resolve, reject) => {
      if ((window as any).Razorpay) return resolve(true);
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay script"));
      document.body.appendChild(script);
    });
  };

  // Request OTP from server (buyer will receive and show this OTP, which they give to seller)
  const requestOTPFromServer = async (bookingId: string) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/booking/${bookingId}/generate-otp`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      return response.data; // expect { otp, expiresAt }
    } catch (err: any) {
      console.error('Failed to request OTP', err);
      throw err;
    }
  };

  // Helper: compute discount meta for a parkingSpace (keeps original logic)
  const computePriceMeta = (space: any) => {
    const baseRaw = space?.priceParking ?? space?.price ?? 0;
    const base = Number(baseRaw) || 0;
    let rawDiscount = space?.discount ?? space?.discountPercent ?? space?.discount_percentage ?? 0;
    if (typeof rawDiscount === 'string') rawDiscount = rawDiscount.replace?.('%', '') ?? rawDiscount;
    if (typeof rawDiscount === 'object' && rawDiscount !== null) {
      rawDiscount = rawDiscount.percent ?? rawDiscount.value ?? rawDiscount.amount ?? 0;
    }
    const discountNum = Number(rawDiscount);
    const discountPercent = Number.isFinite(discountNum) ? Math.max(0, Math.min(100, discountNum)) : 0;
    return { basePrice: +base.toFixed(2), discountPercent, hasDiscount: discountPercent > 0 };
  };

  // Calculate duration in hours
  const getHoursDuration = (startISO: string, endISO: string) => {
    try {
      const start = new Date(startISO).getTime();
      const end = new Date(endISO).getTime();
      if (isNaN(start) || isNaN(end) || end <= start) return 0;
      const ms = end - start;
      const hours = ms / (1000 * 60 * 60);
      return hours;
    } catch {
      return 0;
    }
  };

  const computeTotalsForBooking = (booking: Booking) => {
    const space = booking.parkingSpace ?? {};
    const meta = computePriceMeta(space);
    const perHour = Number(booking.priceParking ?? meta.basePrice ?? 0) || 0;
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

  // Generic pay flow used for initial booking payment
  // Replace your existing handlePayNow with this
const handlePayNow = async (bookingId: string, amountInRupees: number) => {
  try {
    await loadRazorpayScript();

    // convert to paise and ensure integer
    const amountInPaise = Math.round(Number(amountInRupees) * 100);

    const { data: paymentData } = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/payment/initiate-payment`,
      { bookingId, amount: amountInPaise }, // send integer paise
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      }
    );

    const options = {
      key: "rzp_test_eQoJ7XZxUf37D7",
      amount: paymentData.amount, // amount is expected as integer paise from backend
      currency: "INR",
      order_id: paymentData.orderId,
      handler: async (response: any) => {
        try {
          await axios.post(
            `${import.meta.env.VITE_BASE_URL}/api/payment/verify-payment`,
            {
              bookingId,
              razorpay_order_id: paymentData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            {
              headers: {
                Authorization: `Bearer ${localStorage.getItem("token")}`,
              },
            }
          );

          alert("Payment successful!");
          setBookings((prevBookings) =>
            prevBookings.map((b) => (b._id === bookingId ? { ...b, paymentStatus: "paid" } : b))
          );
        } catch (e) {
          console.error(e);
          alert("Payment verification failed");
        }
      },
      prefill: {
        name: "Parking Space",
        email: "customer@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#FFC107",
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  } catch (err) {
    console.error("handlePayNow error:", err);
    alert("Failed to initiate payment");
  }
};

// Replace your existing handleExtendAndPay with this
const handleExtendAndPay = async (booking: Booking) => {
  try {
    // charge for one hour at per-hour rate (in rupees)
    const totals = computeTotalsForBooking(booking);
    const amountRupees = Number(totals.perHour || 0);

    await loadRazorpayScript();

    // convert rupees to paise (integer)
    const amountInPaise = Math.round(amountRupees * 100);

    // Pass extend flag - backend should accept it and interpret amount as paise
    const { data: paymentData } = await axios.post(
      `${import.meta.env.VITE_BASE_URL}/api/payment/initiate-payment`,
      { bookingId: booking._id, amount: amountInPaise, extend: true },
      { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
    );

    const options = {
      key: "rzp_test_eQoJ7XZxUf37D7",
      amount: paymentData.amount,
      currency: "INR",
      order_id: paymentData.orderId,
      handler: async (response: any) => {
        try {
          await axios.post(
            `${import.meta.env.VITE_BASE_URL}/api/payment/verify-payment`,
            {
              bookingId: booking._id,
              razorpay_order_id: paymentData.orderId,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
            },
            { headers: { Authorization: `Bearer ${localStorage.getItem("token")}` } }
          );

          // Refresh booking after extension payment (backend must update booking.endTime)
          const refreshed = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/${booking._id}`, {
            headers: { Authorization: `Bearer ${localStorage.getItem("token")}` },
          });

          const updatedBooking = refreshed.data;
          setBookings((prev) => prev.map((b) => (b._id === booking._id ? updatedBooking : b)));
          alert("Extension paid and applied — Complete button re-enabled.");
        } catch (e) {
          console.error("Extension payment verification failed", e);
          alert("Extension payment verification failed");
        }
      },
      prefill: {
        name: "Parking Space",
        email: "customer@example.com",
        contact: "9999999999",
      },
      theme: {
        color: "#FFC107",
      },
    };

    const razorpay = new (window as any).Razorpay(options);
    razorpay.open();
  } catch (err) {
    console.error("handleExtendAndPay error:", err);
    alert("Failed to create extension payment. Please try again.");
  }
};

  // Generate OTP for completion (buyer action) and show it inline
  const handleGenerateOtpForCompletion = async (booking: Booking) => {
    try {
      const res = await requestOTPFromServer(booking._id);
      // expect { otp, expiresAt }
      setGeneratedOtps((prev) => ({ ...prev, [booking._id]: { otp: res.otp, expiresAt: res.expiresAt } }));
      alert(`OTP generated: ${res.otp}\nGive this OTP to the seller to complete the booking.\nExpires at: ${res.expiresAt ?? "soon"}`);
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

  const statusLabel = (s: string) => {
    switch (s) {
      case 'pending': return { label: 'Pending', color: 'text-yellow-600', iconGreen: false };
      case 'accepted': return { label: 'Accepted', color: 'text-green-600', iconGreen: true };
      case 'confirmed': return { label: 'Confirmed', color: 'text-blue-600', iconGreen: true };
      case 'active': return { label: 'Active', color: 'text-green-600', iconGreen: true };
      case 'rejected': return { label: 'Rejected', color: 'text-red-600', iconGreen: false };
      case 'completed': return { label: 'Completed', color: 'text-gray-600', iconGreen: true };
      default: return { label: s, color: 'text-gray-600', iconGreen: false };
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
            const endTs = new Date(booking.endTime).getTime();
            const isActive = booking.status === "active";
            const beforeEnd = now < endTs;
            const afterOrAtEnd = now >= endTs;
            const totals = computeTotalsForBooking(booking);
            const perHour = totals.perHour;
            const extensionAmount = Math.ceil(perHour);
            const generated = generatedOtps[booking._id];
            const payableStatuses = ['pending', 'accepted', 'confirmed'];
            const showPayNow = booking.paymentStatus === "pending" && payableStatuses.includes(booking.status);

            return (
              <div
                key={booking._id}
                className="p-5 bg-white rounded-lg shadow-lg hover:shadow-xl transition duration-300 ease-in-out transform hover:scale-105"
              >
                <h3 className="text-lg font-semibold text-gray-800 flex items-center mb-4">
                  <FaMapMarkerAlt className="mr-2 text-red-500" />
                  {booking.parkingSpace?.title || "N/A"}
                </h3>
                <ul className="text-gray-600 space-y-2">
                  <li className="flex items-center">
                    <FaRegCalendarAlt className="mr-2 text-red-500" />
                    <span>Start Time: </span>
                    <span className="ml-2">{new Date(booking.startTime).toLocaleString()}</span>
                  </li>
                  <li className="flex items-center">
                    <FaRegCalendarAlt className="mr-2 text-red-500" />
                    <span>End Time: </span>
                    <span className="ml-2">{new Date(booking.endTime).toLocaleString()}</span>
                  </li>
                  <li className="flex items-center">
                    {st.iconGreen ? (
                      <FaCheckCircle className={`mr-2 ${st.color}`} />
                    ) : (
                      <FaTimesCircle className={`mr-2 ${st.color}`} />
                    )}
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
                    <button
                      onClick={() => handleCancelBooking(booking._id)}
                      className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-red-600 transition duration-300 transform hover:scale-105"
                    >
                      <FaTimesCircle className="text-xl" />
                      <span className="ml-2">Cancel</span>
                    </button>
                  )}

                  {showPayNow && (
                    <button
                      onClick={() => handlePayNow(booking._id, totals.discountedTotal)}
                      className="bg-yellow-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-yellow-600 transition duration-300 transform hover:scale-105"
                    >
                      <FaCreditCard className="text-xl" />
                      <span className="ml-2">Pay Now</span>
                    </button>
                  )}

                  {isActive && (
                    <>
                      {beforeEnd && (
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleGenerateOtpForCompletion(booking)}
                            className="bg-green-600 text-white font-semibold py-2 px-4 rounded-lg flex-1 hover:bg-green-700 transition"
                          >
                            Complete
                          </button>
                          <button
                            onClick={() => handleTrackNow(booking)}
                            className="bg-blue-600 text-white font-semibold py-2 px-3 rounded-lg hover:bg-blue-700 transition"
                          >
                            Track
                          </button>
                        </div>
                      )}

                      {afterOrAtEnd && (
                        <div className="flex gap-2">
                          <button
                            disabled
                            className="bg-gray-300 text-gray-700 font-semibold py-2 px-4 rounded-lg flex-1 cursor-not-allowed"
                            title="Complete is disabled after end time; extend and pay to continue session"
                          >
                            Complete (expired)
                          </button>

                          <button
                            onClick={() => handleExtendAndPay(booking)}
                            className="bg-yellow-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-yellow-700 transition"
                          >
                            Extend & Pay 1 hr — ₹{extensionAmount}
                          </button>
                        </div>
                      )}

                      {generated && (
                        <div className="mt-2 p-3 bg-gray-50 rounded border">
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-xs text-gray-500">Completion OTP (give to seller)</div>
                              <div className="font-mono text-lg font-semibold">{generated.otp}</div>
                              {generated.expiresAt && (
                                <div className="text-xs text-gray-500">Expires: {new Date(generated.expiresAt).toLocaleString()}</div>
                              )}
                            </div>
                            <div className="flex flex-col items-end gap-2">
                              <button
                                onClick={() => {
                                  navigator.clipboard?.writeText(generated.otp);
                                  alert("OTP copied to clipboard");
                                }}
                                className="px-3 py-1 bg-blue-600 text-white rounded"
                                title="Copy OTP"
                              >
                                <FaClipboard />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {/* Show Track Now for paid bookings that are not active and not completed (avoids duplication and hides track when completed) */}
                  {booking.paymentStatus === "paid" && booking.status !== "completed" && !isActive && (
                    <div>
                      <button
                        onClick={() => handleTrackNow(booking)}
                        className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 transform hover:scale-105"
                      >
                        Track Now
                      </button>
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
