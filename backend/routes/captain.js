// backend/routes/captain.js
import express from 'express';
import { protect } from '../middleware/auth.js';
import { captainOnly } from '../middleware/auth.js';
import {
  listParkingSpacesForCaptain,
  updateParkingSpaceStatusByCaptain,
} from '../controllers/captain.js';

const router = express.Router();

router.get('/parkingspaces', protect, captainOnly, listParkingSpacesForCaptain);
router.patch('/parkingspaces/:id/status', protect, captainOnly, updateParkingSpaceStatusByCaptain);

export default router;
