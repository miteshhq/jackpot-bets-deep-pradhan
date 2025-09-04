import express from 'express';
import {
    createDepositRequest,
    getAllDepositRequests,
    approveDepositRequest,
    rejectDepositRequest,
    createWithdrawalRequest,
    getAllWithdrawalRequests,
    processWithdrawalRequest,
    getUserBalance,
    getUserTransactions,
    getAllTransactions,
    getTotalTransactions,
    adminAddCoins,
    adminRemoveCoins,
} from '../controllers/walletController.js';

const router = express.Router();

// ✅ USER ROUTES - DEPOSITS
router.post('/deposit/request', createDepositRequest);

// ✅ USER ROUTES - WITHDRAWALS
router.post('/withdrawal/request', createWithdrawalRequest);

// ✅ USER ROUTES - GENERAL
router.get('/get-balance/:userId', getUserBalance);
router.get('/transactions/:userId', getUserTransactions);

// ✅ ADMIN ROUTES - DEPOSITS
router.get('/admin/deposits', getAllDepositRequests);
router.post('/admin/deposits/approve', approveDepositRequest);
router.post('/admin/deposits/reject', rejectDepositRequest);

// ✅ ADMIN ROUTES - WITHDRAWALS
router.get('/admin/withdrawals', getAllWithdrawalRequests);
router.post('/admin/withdrawals/process', processWithdrawalRequest);

// ✅ ADMIN ROUTES - TRANSACTIONS
router.get('/transactions/total', getTotalTransactions);
router.get('/transactions', getAllTransactions);

router.post('/admin/add-coins', adminAddCoins);
router.post('/admin/remove-coins', adminRemoveCoins);

export default router;
