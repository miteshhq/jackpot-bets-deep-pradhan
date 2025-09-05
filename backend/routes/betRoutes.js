import express from 'express';
import {
    placeBet,
    getAllBets,
    declareResult,
    getBetsByUser,
    getBetsByBarcode,
    getBetsSummary,
    getDailyProfitLoss,
    getBetsHistory,
    updateBetClaimStatus, // ✅ Add this import
} from '../controllers/betController.js';

const router = express.Router();

// ✅ Bet placing and results
router.post('/place', placeBet);
router.post('/result', declareResult);

// ✅ Get all bets (admin)
router.get('/all', getAllBets);

// ✅ Get bets by user
router.get('/user/:userId', getBetsByUser);

// ✅ Get bets by barcode (for barcode search)
router.get('/by-barcode/:barcode', getBetsByBarcode);
router.get('/summary', getBetsSummary);
router.get('/daily-profit-loss', getDailyProfitLoss);
router.get('/gethistory', getBetsHistory);

// ✅ Add claim status update route
router.post('/claim-status', updateBetClaimStatus);

export default router;
