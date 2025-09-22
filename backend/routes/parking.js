import express from 'express';
import { protect } from '../middleware/auth.js';
import {
  registerParkingSpace,
  updateParkingSpace,
  deleteParkingSpace,
  getParkingSpaces,
  getParkingSpaceById,
  getMyParkingSpaces,
  getParkingSpaceAvailability,
} from '../controllers/parking.js';
import multer from 'multer';

const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

const router = express.Router();

router.post('/', protect, registerParkingSpace);
router.put('/:id', protect, upload.array('photos', 5), updateParkingSpace);
router.delete('/:id', protect, deleteParkingSpace);
router.get('/', getParkingSpaces);
router.get('/my-spaces', protect, getMyParkingSpaces);
router.get('/:id', getParkingSpaceById);
router.get('/availability/:spaceId',protect, getParkingSpaceAvailability);

export default router;