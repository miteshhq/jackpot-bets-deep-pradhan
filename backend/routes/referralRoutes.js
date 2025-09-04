// backend/routes/referralRoutes.js
import express from "express";
import { generateLink } from "../controllers/referralController.js";

const router = express.Router();

// POST /api/referrals/generate-link
router.post("/generate-link", generateLink);

export default router;



