import express from 'express';
import {
    getSalesReport,
    getTotalWithdrawals,
    cancelBet,
    getCancelledAmount,
    getDepositsReport,
    getWithdrawalsReport,
    getDailyStatsReport,
    getProfitLossReport,
    getUserStatsReport,
    getBetsSummaryReport
} from '../controllers/reportController.js';

const router = express.Router();

// Existing routes
router.get('/sales', getSalesReport);
router.get('/transactions/total-withdrawals', getTotalWithdrawals);
router.post('/cancel/:betId', cancelBet);
router.get('/cancelled-amount', getCancelledAmount);

// New comprehensive report routes
router.get('/deposits', getDepositsReport);
router.get('/withdrawals', getWithdrawalsReport);
router.get('/daily-stats', getDailyStatsReport);
router.get('/profit-loss', getProfitLossReport);
router.get('/user-stats', getUserStatsReport);
router.get('/bets-summary', getBetsSummaryReport);

export default router;
