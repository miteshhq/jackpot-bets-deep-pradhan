import express from 'express';
import {
    getAllAdmins,
    createAdmin,
    updateAdmin,
    deleteAdmin,
    getAdminCount
} from '../controllers/adminController.js';
import { verifyToken } from '../controllers/authController.js';

const router = express.Router();

// All routes require admin authentication
router.use(verifyToken);

// Admin CRUD operations
router.get('/all', getAllAdmins);
router.post('/create', createAdmin);
router.put('/update/:id', updateAdmin);
router.delete('/delete/:id', deleteAdmin);
router.get('/count', getAdminCount);

export default router;
