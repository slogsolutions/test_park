import express from "express";
import {protect} from "../middleware/auth.js";
import { saveToken, removeToken } from "../controllers/userToken.js";

const router = express.Router();

router.post("/save-token" , saveToken);
router.delete("/remove-token", removeToken);

export default router;
