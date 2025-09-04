import express from 'express';
import {
  createOrder,
  verifyPaymentAndUpdateBalance,
  getUserBalance,
  getUserTransactions,
  getAllTransactions,
  getTotalTransactions,
} from '../controllers/razorpayController.js';

const router = express.Router();

// ✅ USER ROUTES
router.post('/create-order', createOrder);
router.post('/verify-payment', verifyPaymentAndUpdateBalance);
router.get('/get-balance/:userId', getUserBalance);

// ✅ ADMIN ROUTES — ⚠️ Order matters!
router.get('/transactions/total', getTotalTransactions);  // keep before /transactions/:userId
router.get('/transactions', getAllTransactions);
router.get('/transactions/:userId', getUserTransactions);

// Export router
export default router;