// import cron from "node-cron";
// import mongoose from "mongoose";
// import Booking from "./models/Booking.js"; // Import your Booking model

// const deleteExpiredBookings = async () => {
//   try {
//     const oneHourAgo = new Date();
//     oneHourAgo.setHours(oneHourAgo.getHours() - 1); // Subtract 1 hour

//     // Delete bookings that were created more than 1 hour ago and are still pending
//     const result = await Booking.deleteMany({ 
//       createdAt: { $lte: oneHourAgo }, 
//       status: "pending" // Only delete if still pending
//     });

//     console.log(`${result.deletedCount} expired bookings deleted at ${new Date().toLocaleString()}`);
//   } catch (error) {
//     console.error("Error deleting expired bookings:", error);
//   }
// };

// // Schedule the cron job to run every hour
// cron.schedule("0 * * * *", deleteExpiredBookings, {
//   scheduled: true,
//   timezone: "Asia/Kolkata", // Set timezone if needed
// });

// export default deleteExpiredBookings;
