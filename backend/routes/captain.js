// backend/routes/captain.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import { captainOnly } from '../middleware/roles.js';
import ParkingSpace from '../models/ParkingSpace.js';
import mongoose from 'mongoose';

const router = express.Router();

// Simple helper to pull owner id from different possible fields
const getOwnerId = (space) => {
  const candidates = ['owner', 'user', 'provider', 'createdBy'];
  for (const k of candidates) {
    if (space[k]) {
      const v = space[k];
      if (typeof v === 'object' && v._id) return String(v._id);
      return String(v);
    }
  }
  return null;
};

/**
 * GET /api/captain/parkingspaces?status=pending
 * List parking spaces belonging to the captain (optionally filter by status).
 */
router.get('/parkingspaces', protect, captainOnly, async (req, res) => {
  try {
    const rawStatus = req.query.status;
    const statusFilter = rawStatus ? { status: String(rawStatus).toLowerCase() } : {};

    // owner field may differ between models; search in any of those fields
    const ownerFieldNames = ['owner', 'user', 'provider', 'createdBy'];
    const ownerFilters = ownerFieldNames.map((f) => ({ [f]: req.user._id }));

    const query = {
      $and: [
        { $or: ownerFilters },
        ...(rawStatus ? [statusFilter] : []),
      ],
    };

    const spaces = await ParkingSpace.find(query)
      .populate('owner', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    return res.json({ spaces });
  } catch (err) {
    console.error('Error fetching captain parkingspaces:', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

/**
 * PATCH /api/captain/parkingspaces/:id/status
 * Body: { action: "approve" | "reject" }  OR { status: "approved" | "rejected" }
 *
 * This minimal route updates approvedBy/approvedAt and a schema-safe status.
 */
// replace the PATCH handler in backend/routes/captain.js with this

router.patch('/parkingspaces/:id/status', protect, captainOnly, async (req, res) => {
  try {
    const { id } = req.params;
    const actionRaw = req.body.action || req.body.status;
    if (!actionRaw) return res.status(400).json({ message: 'action or status required (approve/reject)' });

    const action = String(actionRaw).toLowerCase().trim();
    const isApprove = action === 'approve' || action === 'approved' || action === 'submit' || action === 'submitted';
    const isReject = action === 'reject' || action === 'rejected';

    if (!isApprove && !isReject) {
      return res.status(400).json({ message: 'Invalid action. Use "approve" or "reject".' });
    }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid parking space id' });
    }

    const space = await ParkingSpace.findById(id).lean();
    if (!space) return res.status(404).json({ message: 'Parking space not found' });

    // debug logging to help you trace the failure
    const ownerId = getOwnerId(space);
    const reqUserId = req.user && req.user._id ? String(req.user._id) : null;
    console.log('[captain/status] action=', action, 'spaceId=', id, 'ownerId=', ownerId, 'reqUser=', reqUserId, 'currentStatus=', space.status);

    if (!reqUserId) return res.status(401).json({ message: 'Authenticated user required' });

    // If you intend captains to moderate any space, REMOVE this owner check.
    // If not, keep it. Currently it prevents updates when owner exists && !== req user.
    if (ownerId && ownerId !== reqUserId) {
      return res.status(403).json({ message: 'You are not the owner of this parking space' });
    }

    // map to schema-safe status values
    // map to schema-safe status values
// Approve => 'approved', Reject => 'rejected'
const newStatus = isApprove ? 'approved' : 'rejected';


    // build update using $set / $unset to avoid setting undefined
    const update = { $set: { status: newStatus } };
    if (isApprove) {
      update.$set.approvedBy = req.user._id;
      update.$set.approvedAt = new Date();
      // ensure any rejected-only fields are removed
      update.$unset = update.$unset || {};
      // example: update.$unset.rejectionReason = "";
    } else {
      // reject: remove approval metadata cleanly
      update.$unset = { approvedBy: "", approvedAt: "" };
    }

    const updated = await ParkingSpace.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();

    if (!updated) return res.status(404).json({ message: 'Parking space not found after update' });

    // socket emit (optional)
    try {
      req.app.get('io')?.emit('parking-space-updated', { id: updated._id, status: updated.status });
    } catch (e) {
      console.warn('Socket emit failed:', e);
    }

    return res.json({ message: isApprove ? 'Space approved' : 'Space rejected', space: updated });
  } catch (err) {
    console.error('Captain route error (parkingspace status):', err);
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});


export default router;
