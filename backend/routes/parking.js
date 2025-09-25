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
import path from 'path';
import fs from 'fs';

const uploadDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// accept only images; prevents Multer errors that can drop body fields
const fileFilter = (req, file, cb) => {
  if (/^image\//.test(file.mimetype)) return cb(null, true);
  return cb(new Error('Only image uploads are allowed'));
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }
});

const router = express.Router();

router.post('/', protect, upload.array('photos', 5), registerParkingSpace);
router.put('/:id', protect, upload.array('photos', 5), updateParkingSpace);

// Put specific routes before the parameterized route
router.get('/my-spaces', protect, getMyParkingSpaces);
router.get('/:id/availability', protect, getParkingSpaceAvailability); // recommended
router.get('/:id', getParkingSpaceById);

router.delete('/:id', protect, deleteParkingSpace);
router.get('/', getParkingSpaces);

export default router;
