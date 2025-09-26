import cron from 'node-cron';
import mongoose from 'mongoose';
import Booking from './models/Booking.js';
import ParkingSpace from './models/ParkingSpace.js';

// This function checks bookings and marks them completed when endTime <= now
export const startBookingCompletionCron = () => {
  // Run every minute
  cron.schedule('* * * * *', async () => {
    try {
      const now = new Date();
      // Find bookings that are accepted/confirmed and whose endTime is in the past but not yet marked completed
      const toComplete = await Booking.find({
        status: { $in: ['accepted', 'confirmed'] },
        endTime: { $lte: now },
        completedAt: null,
      });

      for (const booking of toComplete) {
        booking.status = 'completed';
        booking.completedAt = new Date();
        await booking.save();

        // Optional: free the slot in parkingSpace availability
        try {
          if (booking.parkingSpace) {
            const startDateMidnight = new Date(booking.startTime);
            startDateMidnight.setHours(0, 0, 0, 0);
            const startTime = new Date(booking.startTime);
            const endTime = new Date(booking.endTime);

            await ParkingSpace.findByIdAndUpdate(
              booking.parkingSpace,
              {
                $set: {
                  'availability.$[dateElem].slots.$[slotElem].isBooked': false,
                },
              },
              {
                arrayFilters: [
                  { 'dateElem.date': { $eq: startDateMidnight.getTime() } },
                  { 'slotElem.startTime': startTime, 'slotElem.endTime': endTime },
                ],
                new: true,
              }
            );
          }
        } catch (innerErr) {
          console.warn('Failed to free parking slot on completion', innerErr);
        }
      }

      if (toComplete.length) {
        console.log(`[cron] Completed ${toComplete.length} booking(s) at ${now.toISOString()}`);
      }
    } catch (err) {
      console.error('[cron] Error checking/completing bookings', err);
    }
  }, {
    scheduled: true,
    timezone: 'Asia/Kolkata',
  });

  console.log('Booking completion cron job started - runs every minute');
};