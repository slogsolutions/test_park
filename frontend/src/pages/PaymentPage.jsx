import React from "react";

const PaymentPage = ({ booking }) => {
  const handlePayment = () => {
    const options = {
      key: "rzp_test_eQoJ7XZxUf37D7", // Replace with your Razorpay Key
      amount: booking.totalPrice * 100, // Amount in paise
      currency: "INR",
      name: "Parking Booking Payment",
      description: `Payment for booking ID: ${booking._id}`,
      image: "/path/to/your/logo.png", // Optional logo
      handler: async function (response) {
        // Payment was successful
        alert("Payment successful");
        console.log(response);

        // Call API to update payment status
        try {
          const res = await fetch(`http://localhost:5000/api/booking/${booking._id}/update-payment-status`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${localStorage.getItem("token")}`, // Replace with your auth mechanism
            },
            body: JSON.stringify({ paymentStatus: "paid" }),
          });

          if (!res.ok) {
            const error = await res.json();
            alert(`Failed to update payment status: ${error.message}`);
          } else {
            alert("Payment status updated successfully.");
          }
        } catch (err) {
          console.error("Error updating payment status:", err);
          alert("An error occurred while updating payment status.");
        }
      },
      prefill: {
        name: "User Name", // Optional: Prefill user details
        email: "user@example.com",
        contact: "1234567890",
      },
      theme: {
        color: "#3399cc",
      },
    };

    const rzp = new window.Razorpay(options);
    rzp.open();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">Payment</h2>
        <p className="text-gray-600 mb-4">
          You're about to pay for booking ID:{" "}
          <span className="font-medium">{booking._id}</span>
        </p>
        <p className="text-gray-800 mb-6">
          Total Price: <span className="font-bold text-green-600">₹{booking.totalPrice}</span>
        </p>
        <button
          onClick={handlePayment}
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-md hover:bg-blue-600 transition duration-300"
        >
          Pay Now
        </button>
      </div>
    </div>
  );
};

export default PaymentPage;
