import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaMapMarkerAlt, FaRegCalendarAlt, FaCheckCircle, FaMoneyBillWave, FaTimesCircle, FaCreditCard } from "react-icons/fa"; // Import required icons
import LoadingScreen from "../../pages/LoadingScreen";

type Booking = {
  _id: string;
  parkingSpace: { title: string } | null;
  startTime: string;
  endTime: string;
  status: string;
  paymentStatus: string;
  totalPrice: number;
};

const MyBookings: React.FC = () => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/my-bookings`, {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setBookings(response.data);
      } catch (err) {
        setError("Failed to fetch bookings");
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

      setBookings((prevBookings) =>
        prevBookings.filter((booking) => booking._id !== bookingId)
      );
      alert("Booking cancelled successfully");
    } catch {
      alert("Failed to cancel booking");
    }
  };

  const loadRazorpayScript = async () => {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => reject(new Error("Failed to load Razorpay script"));
      document.body.appendChild(script);
    });
  };

  const generateOTP = () => Math.floor(100000 + Math.random() * 900000).toString();

  const handlePayNow = async (bookingId: string, amount: number) => {
    try {
      await loadRazorpayScript();

      const { data: paymentData } = await axios.post(
        `${import.meta.env.VITE_BASE_URL}/api/payment/initiate-payment`,
        { bookingId, amount },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        }
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
              prevBookings.map((booking) =>
                booking._id === bookingId
                  ? { ...booking, paymentStatus: "paid" }
                  : booking
              )
            );
          } catch (e) {
            console.log(e);
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: "Parking Space",
          email: "customer@example.com",
          contact: "9999999999",
        },
        theme: {
          color: "#FFC107", // red color for Razorpay theme
        },
      };

      const razorpay = new (window as any).Razorpay(options);
      razorpay.open();
    } catch {
      alert("Failed to initiate payment");
    }
  };


  if (loading) {
    return (
      <div className="h-[calc(100vh-64px)] flex items-center justify-center">
       <LoadingScreen/>
      </div>
    );
  }
  if (error) {
    return <p>{error}</p>;
  }

  return (
    <div className="max-w-4xl mx-auto  mb-40 p-6 bg-gradient-to-r  shadow-xl rounded-xl">
      <h2 className="text-3xl font-semibold text-gray-800 mb-6 text-center">Your Bookings</h2>
      {bookings.length === 0 ? (
        <p className="text-center text-gray-500">You don't have any bookings.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {bookings.map((booking) => (
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
                  <span>{new Date(booking.startTime).toLocaleString()}</span>
                </li>
                <li className="flex items-center">
                  <FaRegCalendarAlt className="mr-2 text-red-500" />
                  <span>End Time: </span>
                  <span>{new Date(booking.endTime).toLocaleString()}</span>
                </li>
                <li className="flex items-center">
                  <FaCheckCircle className="mr-2 text-green-500" />
                  <span>Status: </span>
                  <span>{booking.status}</span>
                </li>
                <li className="flex items-center">
                  <FaMoneyBillWave className="mr-2 text-green-600" />
                  <span>Total Price: </span>
                  <span>₹{Math.ceil(booking.totalPrice)}</span>
                </li>
              </ul>
              <div className="mt-4 flex  space-x-4">
                {/* Buttons centered and aligned */}
                {booking.status === "pending" && (
                  <button
                    onClick={() => handleCancelBooking(booking._id)}
                    className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-red-600 transition duration-300 transform hover:scale-105"
                  >
                    <FaTimesCircle className="text-xl" />
                    <span className="ml-2">Cancel</span>
                  </button>
                )}
                {booking.paymentStatus === "pending" && booking.status === "accepted" && (
                  <button
                    onClick={() => handlePayNow(booking._id, Math.ceil(booking.totalPrice))}
                    className="bg-red-500 text-white font-semibold py-2 px-4 rounded-lg flex items-center hover:bg-red-600 transition duration-300 transform hover:scale-105"
                  >
                    <FaCreditCard className="text-xl" />
                    <span className="ml-2">Pay Now</span>
                  </button>
                )}
              </div>
              {booking.paymentStatus === "paid" && (
                <div className="mt-4 ">
                  <button
                    onClick={() =>
                      navigate("/track", {
                        state: {
                          parkingSpace: booking.parkingSpace,
                          otp: generateOTP(),
                        },
                      })
                    }
                    className="bg-green-500 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-600 transition duration-300 transform hover:scale-105"
                  >
                    Track Now
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyBookings;
