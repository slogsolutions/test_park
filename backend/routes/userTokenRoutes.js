import express from "express";
import {protect} from "../middleware/auth.js";
import { saveToken, removeToken } from "../controllers/userToken.js";

const router = express.Router();

router.post("/save-token" ,protect, saveToken);
router.delete("/remove-token",protect, removeToken);

export default router;
