import express from 'express';
import { getSalesReport,
     getTotalWithdrawals,
    cancelBet,
      getCancelledAmount,     } from '../controllers/reportController.js';

const router = express.Router();

// /api/report/sales
router.get('/sales', getSalesReport);

// ✅ Use this route in frontend: /api/report/transactions/total-withdrawals
router.get('/transactions/total-withdrawals', getTotalWithdrawals);
router.post('/cancel/:betId', cancelBet); // ✅ Add this line
router.get('/cancelled-amount', getCancelledAmount);

export default router;



