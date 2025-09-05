import express from 'express';
import {
  sendUserOTP,
  verifyUserOTP,
  loginUser,        // **loginUser ko add kiya**
  loginAdmin,
  getUserData,
  getAllUsers,
  verifyToken,
  getUserCount,
  sendResetPasswordOTP,
  verifyResetPasswordOTP,
    deleteUserByAdmin
} from '../controllers/authController.js';

const router = express.Router();

// Public routes
router.post('/send-otp', sendUserOTP);
router.post('/verify-otp', verifyUserOTP);
router.post('/login', loginUser);        // **Login route yahan add karo**
router.post('/admin-login', loginAdmin);

// Protected routes (token chahiye)
router.get('/me', verifyToken, getUserData);
router.get('/all-users', verifyToken, getAllUsers);
router.get('/admin/user-count', verifyToken, getUserCount);
router.post('/send-reset-otp', sendResetPasswordOTP);
router.post('/verify-reset-otp', verifyResetPasswordOTP);

// Add this to your existing routes
router.delete('/admin/users/:id', verifyToken, deleteUserByAdmin);

export default router;
