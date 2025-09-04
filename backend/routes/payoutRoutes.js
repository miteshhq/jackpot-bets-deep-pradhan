import express from "express";
import {
  requestPayout,
  getPayoutRequests,
  approvePayout,
  rejectPayout,
  payPayout,
  getApprovedPayouts,
  updatePayoutStatus
} from "../controllers/payoutController.js";

const router = express.Router();

// 🧑 User withdraw request
router.post("/request", requestPayout);

// 👨‍💼 Admin - All payout requests
router.get("/requests", getPayoutRequests);

// 👨‍💼 Admin - Approve payout
router.post("/approve", approvePayout);

// 👨‍💼 Admin - Reject payout
router.post("/reject", rejectPayout);

// 👨‍💼 Admin - Pay user (mark as paid + transaction entry)
router.post("/pay", payPayout);

// ✅ Only approved payouts
router.get("/approved", getApprovedPayouts);
router.post("/update", updatePayoutStatus);

export default router;


