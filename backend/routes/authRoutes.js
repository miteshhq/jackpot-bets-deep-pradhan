import express from 'express';
import {
    sendUserOTP,
    verifyUserOTP,
    loginUser,
    loginAdmin,
    getUserData,
    getAllUsers,
    verifyToken,
    getUserCount,
    sendResetPasswordOTP,
    verifyResetPasswordOTP,
    deleteUserByAdmin,
    getAdminInfo
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendUserOTP);
router.post('/verify-otp', verifyUserOTP);
router.post('/login', loginUser);
router.post('/admin-login', loginAdmin);
router.post('/send-reset-otp', sendResetPasswordOTP);
router.post('/verify-reset-otp', verifyResetPasswordOTP);

// Protected routes (token required)
router.get('/me', verifyToken, getUserData);
router.get('/admin-info', verifyToken, getAdminInfo);
router.get('/all-users', verifyToken, getAllUsers);
router.get('/admin/user-count', verifyToken, getUserCount);
router.delete('/admin/users/:id', verifyToken, deleteUserByAdmin);

export default router;
