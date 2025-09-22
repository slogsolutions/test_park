import mongoose from 'mongoose';
import Booking from '../models/Booking.js';
import ParkingSpace from '../models/ParkingSpace.js';
import ParkFinderSecondUser from '../models/User.js'
// export const createBooking = async (req, res) => {
//   try {
//     const { parkingSpaceId, startTime, endTime } = req.body;

//     const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
//     if (!parkingSpace) {
//       console.log(parkingSpaceId);
      
//       return res.status(404).json({ message: 'Parking space not found' });
//     }

//     // Calculate total price based on duration and price per hour
//     const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60); // hours
//     const totalPrice = duration * parkingSpace.pricePerHour;

//     const booking = new Booking({
//       user: req.user._id,
//       parkingSpace: parkingSpaceId,
//       startTime,
//       endTime,
//       totalPrice,
//     });

//     await booking.save();

//     // Update parking space availability
//     // This is a simplified version - in production, you'd want to handle conflicts
//     await ParkingSpace.findByIdAndUpdate(parkingSpaceId, {
//       $push: {
//         'availability.$[].slots': {
//           startTime,
//           endTime,
//           isBooked: true,
//         },
//       },
//     });

//     res.status(201).json(booking);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to create booking' });
//   }
// };

export const createBooking = async (req, res) => {
  try {
    const { parkingSpaceId, startTime, endTime, vehicleNumber, vehicleType, vehicleModel, contactNumber, chassisNumber } = req.body;

    console.log('Extracted values:', {
      parkingSpaceId,
      startTime,
      endTime,
      vehicleNumber,
      vehicleType,
      vehicleModel,
      contactNumber,
      chassisNumber
    });

    // Step 1: Find the parking space and ensure pricePerHour is available
    const parkingSpace = await ParkingSpace.findById(parkingSpaceId);
    if (!parkingSpace) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    const { pricePerHour, availability, providerId } = parkingSpace;

    if (!startTime || !endTime || !pricePerHour) {
      return res.status(400).json({ message: "Invalid data for price calculation" });
    }

    // Step 2: Check availability of the parking space during the selected time slot
    const isSlotBooked = availability.some(dateObj => {
      // Iterate over each date's slots
      return dateObj.slots.some(slot => {
        const slotStart = new Date(slot.startTime);
        const slotEnd = new Date(slot.endTime);
        const requestedStart = new Date(startTime);
        const requestedEnd = new Date(endTime);

        // Check if the requested time overlaps with an existing booked slot
        return (
          (requestedStart >= slotStart && requestedStart < slotEnd) || 
          (requestedEnd > slotStart && requestedEnd <= slotEnd) || 
          (requestedStart <= slotStart && requestedEnd >= slotEnd)
        ) && slot.isBooked;
      });
    });

    if (isSlotBooked) {
      return res.status(400).json({ message: 'Selected time slot is already booked' });
    }

    // Step 3: Calculate the total price based on duration and price per hour
    const duration = (new Date(endTime) - new Date(startTime)) / (1000 * 60 * 60); // Duration in hours
    const totalPrice = duration * pricePerHour;

    // Step 4: Create the booking entry
    const booking = new Booking({
      user: req.user._id,
      parkingSpace: parkingSpaceId,
      startTime,
      endTime,
      totalPrice,
      pricePerHour,
      vehicleNumber,
      vehicleType,
      vehicleModel,
      contactNumber,
      chassisNumber,
      providerId, // Use the providerId from parkingSpace
      status: 'pending',  // Default status
    });

    await booking.save();

    // Step 5: Update the parking space availability
    const updatedParkingSpace = await ParkingSpace.findByIdAndUpdate(parkingSpaceId, {
      $set: {
        'availability.$[dateElem].slots.$[slotElem].isBooked': true,  // Update the isBooked field of the matched slot
      }
    }, {
      arrayFilters: [
        { 'dateElem.date': { $eq: new Date(startTime).setHours(0, 0, 0, 0) } },  // Match the exact date (ignoring time)
        { 'slotElem.startTime': new Date(startTime), 'slotElem.endTime': new Date(endTime) }  // Match the start and end times
      ],
      new: true,  // Returns the updated document
    });

    if (!updatedParkingSpace) {
      return res.status(500).json({ message: 'Failed to update parking space availability' });
    }

    // Step 6: Notify the provider (send a message/email, etc.)
    const provider = await ParkFinderSecondUser.findById(providerId); // Use the providerId here
    if (provider) {
      sendNotification(provider.email, 'New Booking Received', `You have a new booking for parking space: ${parkingSpaceId} from ${startTime} to ${endTime}.`);
    }

    // Step 7: Respond with the booking details
    res.status(201).json({ message: 'Booking created successfully!', booking });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ message: 'Failed to create booking' });
  }
};



export const getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ user: req.user._id })
      .populate('parkingSpace')
      .sort('-createdAt');
    res.json(bookings);
  } catch (error) {
    console.log(error);
    
    res.status(500).json({ message: 'Failed to get bookings', e:error });
  }
};

// export const updateBookingStatus = async (req, res) => {
//   try {
//     const { status } = req.body;
//     const booking = await Booking.findById(req.params.id);

//     if (!booking) {
//       return res.status(404).json({ message: 'Booking not found' });
//     }

//     // Only allow the parking space owner or the booking user to update status
//     const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
//     console.log(parkingSpace);
    
//     if (
//       parkingSpace.owner.toString() !== req.user._id.toString() &&
//       booking.user.toString() !== req.user._id.toString()
//     ) {
//       return res.status(403).json({ message: 'Not authorized' });
//     }

//     booking.status = status;
//     await booking.save();

//     res.json(booking);
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update booking status' });
//   }
// };


export const updateBookingStatus = async (req, res) => {
  try {
    console.log("Received PUT request at:", req.originalUrl);
    const { status } = req.body;

    // Validate status
    const allowedStatuses = ['pending', 'accepted', 'rejected', 'confirmed', 'completed', 'cancelled'];

    if (!allowedStatuses.includes(status)) {
      console.log("invalid status");
      
      return res.status(400).json({ message: 'Invalid status' });
    }

    const booking = await Booking.findById(req.params.id);
    console.log(booking);
    
    if (!booking) {
      console.log("no boking found");
      
      return res.status(404).json({ message: 'Booking not found' });
    }

    const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
    if (!parkingSpace) {
      console.log("no Parking space found");

      return res.status(404).json({ message: 'Parking space not found' });
    }

    // Authorization check
    const isOwner = parkingSpace.owner.toString() === req.user._id.toString();
    const isBookingUser = booking.user.toString() === req.user._id.toString();

    if (!isOwner && !isBookingUser) {
      console.log("not authorized to update status");
      
      return res.status(403).json({ message: 'Not authorized to update status' });
    }

    // Update and save status
    booking.status = status;
    await booking.save();

    res.status(200).json({
      message: 'Booking status updated successfully',
      booking,
    });
  } catch (error) {
    console.error('Error updating booking status:', error);
    res.status(500).json({ message: 'Failed to update booking status' });
  }
};

export const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('parkingSpace');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Only allow the parking space owner or the booking user to view details
    const parkingSpace = await ParkingSpace.findById(booking.parkingSpace);
    if (
      parkingSpace.owner.toString() !== req.user._id.toString() &&
      booking.user.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get booking' });
  }
};

 export const deleteById= async (req, res) => {
  try {
    const { bookingId } = req.params;

    // Assume you're using a database like MongoDB
    await Booking.findByIdAndDelete(bookingId);

    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete booking', error });
  }
}

export const getProviderBookings = async (req, res) => {
  console.log("inside provider booking");

  try {
    const providerId = req.user._id; // Get provider ID from the authenticated user
    console.log('Provider ID:', providerId);

    // Make sure providerId is valid
    const providerIdObject = new mongoose.Types.ObjectId(providerId);

    // Find all parking spaces associated with this provider
    const parkingSpaces = await ParkingSpace.find({ owner: providerIdObject });
    console.log('Parking Spaces:', parkingSpaces);

    // If no parking spaces are found, return an empty array
    if (!parkingSpaces.length) {
      return res.status(200).json([]);
    }

    const parkingSpaceIds = parkingSpaces.map(space => space._id);

    // Find all bookings associated with these parking spaces
    const bookings = await Booking.find({ parkingSpace: { $in: parkingSpaceIds } })
      .populate('user', 'name email contactNumber') // Populate user details
      .populate('parkingSpace', 'name location pricePerHour') // Populate parking space details
      .select('-__v'); // Exclude unnecessary fields

    console.log('Bookings:', bookings);

    // Respond with the booking details
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    res.status(500).json({ message: 'Failed to fetch bookings', error });
  }
};
