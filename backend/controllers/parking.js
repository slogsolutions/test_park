// controllers/parking.js
import mongoose from 'mongoose';
import ParkingSpace from '../models/ParkingSpace.js';

export const registerParkingSpace = async (req, res) => {
  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const {
      title,
      description,
      location,
      address,  // will be stringified JSON from frontend
      pricePerHour,
      priceParking,
      availability,
      availableSpots,
      amenities,
      discount, // <-- may be string (FormData) or number (JSON)
    } = req.body;

    // Parse address if sent as JSON string
    let addressParsed = address;
    if (typeof address === 'string') {
      try {
        addressParsed = JSON.parse(address);
      } catch (err) {
        return res.status(400).json({ message: '"address" is not valid JSON' });
      }
    }

    // Parse availability if string
    let availabilityParsed = availability;
    if (typeof availability === 'string') {
      try {
        availabilityParsed = JSON.parse(availability);
      } catch (err) {
        return res.status(400).json({ message: '"availability" is not valid JSON' });
      }
    }

    // Parse location if string, and add fallback to lat/lng fields
    let locationParsed = location;
    if (typeof location === 'string') {
      try {
        locationParsed = JSON.parse(location);
      } catch {
        // keep as string; we will try lat/lng fallback below
      }
    }

    // Build coordinates from any accepted shape
    let coords;
    if (locationParsed) {
      if (locationParsed.type === 'Point' && Array.isArray(locationParsed.coordinates)) {
        coords = locationParsed.coordinates.map(Number);
      } else if (Array.isArray(locationParsed) && locationParsed.length === 2) {
        coords = locationParsed.map(Number);
      } else if (locationParsed.lng !== undefined && locationParsed.lat !== undefined) {
        coords = [Number(locationParsed.lng), Number(locationParsed.lat)];
      } else if (locationParsed.longitude !== undefined && locationParsed.latitude !== undefined) {
        coords = [Number(locationParsed.longitude), Number(locationParsed.latitude)];
      }
    }

    // Fallback when multipart fields are separate strings: req.body.lat/lng
    if ((!coords || coords.some(Number.isNaN)) && req.body.lat !== undefined && req.body.lng !== undefined) {
      coords = [Number(req.body.lng), Number(req.body.lat)];
    }

    // Log for debugging
    console.log('req.body.lat/lng', req.body.lat, req.body.lng, 'location raw', typeof req.body.location, req.body.location);

    // Strict validation: numeric and in valid ranges
    if (!coords || coords.length !== 2) {
      return res.status(400).json({ message: 'Invalid location coordinates' });
    }
    const [lonNum, latNum] = coords.map(v => Number(v));
    const valid =
      Number.isFinite(lonNum) && Number.isFinite(latNum) &&
      lonNum >= -180 && lonNum <= 180 &&
      latNum >= -90 && latNum <= 90;
    if (!valid) {
      return res.status(400).json({ message: 'Invalid location coordinates' });
    }

    // Process uploaded photos (from multer)
    const photos = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        photos.push(file.filename); // or file.path depending on your multer config
      }
    }

    // Normalize amenities: accept JSON string, CSV string, or array
    let amenitiesParsed = amenities;
    if (typeof amenities === 'string') {
      if (amenities.trim().startsWith('[')) {
        try {
          amenitiesParsed = JSON.parse(amenities);
        } catch {
          amenitiesParsed = [];
        }
      } else {
        amenitiesParsed = amenities
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);
      }
    }
    if (!Array.isArray(amenitiesParsed)) amenitiesParsed = [];

    // Parse discount safely
    let discountNum = 0;
    if (discount !== undefined && discount !== null) {
      discountNum = Number(discount);
      if (Number.isNaN(discountNum)) discountNum = 0;
      // clamp to [0,100]
      if (discountNum < 0) discountNum = 0;
      if (discountNum > 100) discountNum = 100;
    }

    // Create new ParkingSpace
    const parkingSpace = new ParkingSpace({
      owner: req.user._id,
      title,
      description,
      location: {
        type: 'Point',
        coordinates: [lonNum, latNum],
      },
      address: addressParsed,
      pricePerHour,
      priceParking,
      availableSpots,
      availability: availabilityParsed,
      amenities: amenitiesParsed,
      photos,
      discount: discountNum,
    });

    console.log('registered parking space details', parkingSpace);

    await parkingSpace.save();
    res
      .status(201)
      .json({ message: 'Parking space registered successfully!', data: parkingSpace });
  } catch (error) {
    console.error('Error registering parking space:', error.message);
    res
      .status(500)
      .json({ message: 'Failed to register parking space', error: error.message });
  }
};

export const getParkingSpaceAvailability = async (req, res) => {
  const { spaceId } = req.params;

  if (!req.user) {
    return res.status(401).json({ message: 'User not authenticated' });
  }

  try {
    const parkingSpace = await ParkingSpace.findById(spaceId);

    if (!parkingSpace || parkingSpace.isDeleted) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    const availability = (parkingSpace.availability || []).map(avail => {
      return (avail.slots || []).map(slot => ({
        startTime: slot.startTime ? slot.startTime.toISOString() : null,
        endTime: slot.endTime ? slot.endTime.toISOString() : null,
        isBooked: !!slot.isBooked,
      }));
    }).flat();

    res.status(200).json({ availability });
  } catch (error) {
    console.error('Error fetching parking space availability:', error.message);
    res.status(500).json({ message: 'Failed to fetch availability', error: error.message });
  }
};

export const updateParkingSpace = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);
    if (!parkingSpace) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    if (parkingSpace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const updatedSpace = await ParkingSpace.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true }
    );

    res.json(updatedSpace);
  } catch (error) {
    console.log(error);

    res.status(500).json({ message: 'Failed to update parking space' });
  }
};

export const setOnlineStatus = async (req, res) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authorized, user missing' });
    }

    const { isOnline } = req.body;
    if (typeof isOnline !== 'boolean') {
      return res.status(400).json({ message: 'isOnline must be boolean' });
    }

    const id = req.params.id;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid parking space id' });
    }

    const parkingSpace = await ParkingSpace.findById(id);

    if (!parkingSpace || parkingSpace.isDeleted) {
      return res.status(404).json({ message: 'Parking space not found', id });
    }

    const ownerId = parkingSpace.owner ? parkingSpace.owner.toString() : null;
    if (!ownerId || ownerId !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    parkingSpace.isOnline = isOnline;
    await parkingSpace.save();

    return res.json({ message: 'Status updated', parkingSpace });
  } catch (error) {
    console.error('Error setting online status', error);
    return res.status(500).json({ message: 'Failed to set online status' });
  }
};

export const deleteParkingSpace = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id);
    if (!parkingSpace) {
      return res.status(404).json({ message: 'Parking space not found' });
    }

    if (parkingSpace.owner.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    parkingSpace.isDeleted = true;
    parkingSpace.deletedAt = new Date();
    await parkingSpace.save();

    res.json({ message: 'Parking space removed' });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: 'Failed to delete parking space' });
  }
};

// ✅ Modified: returns ALL parking spaces if no lat/lng, otherwise nearby
export const getParkingSpaces = async (req, res) => {
  try {
    const { lat, lng, radius = 5000 } = req.query;

    let query = { isDeleted: { $ne: true } };

    if (lat && lng) {
      query.location = {
        $near: {
          $geometry: {
            type: 'Point',
            coordinates: [parseFloat(lng), parseFloat(lat)],
          },
          $maxDistance: parseInt(radius),
        },
      };
    }

    const parkingSpaces = await ParkingSpace.find(query)
      .populate('owner', 'name')
      .sort('-createdAt');

    res.json(parkingSpaces);
  } catch (error) {
    console.error('Error fetching parking spaces:', error.message);
    res.status(500).json({ message: 'Failed to get parking spaces' });
  }
};

export const getParkingSpaceById = async (req, res) => {
  try {
    const parkingSpace = await ParkingSpace.findById(req.params.id).populate(
      'owner',
      'name'
    );
    if (!parkingSpace || parkingSpace.isDeleted) {
      return res.status(404).json({ message: 'Parking space not found' });
    }
    res.json(parkingSpace);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get parking space' });
  }
};

export const getMyParkingSpaces = async (req, res) => {
  try {
    const parkingSpaces = await ParkingSpace.find({ owner: req.user._id, isDeleted: { $ne: true } }).sort(
      '-createdAt'
    );
    res.json(parkingSpaces);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get your parking spaces' });
  }
};