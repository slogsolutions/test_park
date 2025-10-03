// backend/routes/captain.js  (or similar)
// ... existing imports
import express from 'express';
import { protect } from '../middleware/auth.js';
import { captainOnly } from '../middleware/roles.js'; // whatever you use
import ParkingSpace from '../models/ParkingSpace.js';

const router = express.Router();

// PATCH /api/captain/parkingspaces/:id/status
router.patch('/parkingspaces/:id/status', protect, captainOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body; // expected: 'approved' or 'rejected'
    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const space = await ParkingSpace.findById(id);
    if (!space) return res.status(404).json({ message: 'Parking space not found' });

    // Update according to your schema:
    // If you use `status` for admin life cycle and `isActive` for showing on home:
    space.status = status === 'approved' ? 'active' : 'rejected'; // or 'approved' if you prefer
    // optionally set an "isApprovedByCaptain" flag:
    space.isApprovedByCaptain = status === 'approved';

    await space.save();

    // If you want other systems to know immediately, emit socket event
    try {
      req.app.get('io')?.emit('parking-space-updated', { id: space._id, status: space.status });
    } catch (e) {
      console.warn('Socket emit failed', e);
    }

    return res.json({ message: 'Status updated', space });
  } catch (err) {
    console.error('Error updating space status:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

export default router;
