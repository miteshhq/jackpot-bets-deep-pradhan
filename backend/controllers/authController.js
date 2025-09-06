import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import axios from 'axios';

const API_KEY = 'f4d751b8c1f8d5c3208e3ca6c998c7da73198';
const otpStore = new Map();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// ✅ Updated to check admin from database
const isAdminFromDB = async (phone, password) => {
    try {
        const [admins] = await db.query('SELECT * FROM admins WHERE phone = ?', [phone]);
        if (admins.length === 0) return false;

        const admin = admins[0];
        const passwordMatch = await bcrypt.compare(password, admin.password);
        return passwordMatch ? admin : false;
    } catch (error) {
        console.error('❌ Error checking admin credentials:', error);
        return false;
    }
};

// ✅ Send OTP (unchanged)
export const sendUserOTP = async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const otp = generateOTP();
    otpStore.set(phone, otp);
    setTimeout(() => otpStore.delete(phone), 300000);

    try {
        const smsUrl = `https://apihome.in/panel/api/bulksms/?key=${API_KEY}&mobile=${phone}&otp=${otp}`;
        await axios.get(smsUrl);
        res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send OTP', error: err.message });
    }
};

// ✅ Verify OTP (unchanged)
export const verifyUserOTP = async (req, res) => {
    const { phone, otp, password, referralCode } = req.body;

    if (!phone || !otp || !password)
        return res.status(400).json({ message: 'Phone, OTP and password are required' });

    const storedOtp = otpStore.get(phone);
    if (!storedOtp) return res.status(400).json({ message: 'OTP expired or not generated' });
    if (parseInt(otp) !== storedOtp) return res.status(401).json({ message: 'Invalid OTP' });

    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length > 0) {
        return res.status(409).json({ message: 'User already exists. Please login.' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
        'INSERT INTO users (phone, password, balance) VALUES (?, ?, ?)',
        [phone, hashedPassword, 20]
    );

    const newUserId = result.insertId;

    if (referralCode) {
        const [refRows] = await db.query('SELECT user_id FROM referrals WHERE code = ?', [referralCode]);
        if (refRows.length > 0) {
            const referrerId = refRows[0].user_id;
            await db.query('UPDATE users SET balance = balance + 10 WHERE id = ?', [referrerId]);
            await db.query(
                'INSERT INTO referral_rewards (referrer_id, referred_user_id, amount, created_at) VALUES (?, ?, ?, NOW())',
                [referrerId, newUserId, 10]
            );
        }
    }

    otpStore.delete(phone);

    const token = jwt.sign({ id: newUserId, phone }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({ message: 'Registration successful', token, referralBonus: !!referralCode });
};

// ✅ Updated User Login with database admin check
export const loginUser = async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Phone and password are required' });

    // ✅ Check admin from database first
    const adminUser = await isAdminFromDB(phone, password);
    if (adminUser) {
        const token = jwt.sign({
            admin: true,
            phone: phone,
            adminLevel: adminUser.role || 'admin',
            adminId: adminUser.id,
            adminName: adminUser.name
        }, process.env.JWT_SECRET, { expiresIn: '2h' });
        return res.json({ message: 'Admin login successful', token, isAdmin: true });
    }

    // ✅ Normal user login
    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) return res.status(401).json({ message: 'User not found' });

    const user = users[0];
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) return res.status(401).json({ message: 'Incorrect password' });

    const token = jwt.sign({ id: user.id, phone }, process.env.JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: 'Login successful', token, isAdmin: false });
};

// ✅ Updated Admin Login
export const loginAdmin = async (req, res) => {
    const { phone, password } = req.body;

    const adminUser = await isAdminFromDB(phone, password);
    if (!adminUser) {
        return res.status(403).json({ message: 'Unauthorized - Invalid admin credentials' });
    }

    const token = jwt.sign({
        admin: true,
        phone: phone,
        adminLevel: adminUser.role || 'admin',
        adminId: adminUser.id,
        adminName: adminUser.name
    }, process.env.JWT_SECRET, { expiresIn: '2h' });

    res.json({ token, message: 'Admin login successful' });
};

// Keep all other functions unchanged (verifyToken, getUserData, etc.)
export const verifyToken = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ message: 'No token provided' });

    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'Invalid token format' });

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(401).json({ message: 'Invalid or expired token' });
    }
};

export const getUserData = async (req, res) => {
    try {
        if (req.user.admin) return res.status(403).json({ message: 'Admin does not have user data' });

        const userId = req.user.id;
        const [rows] = await db.query(
            'SELECT id, username, phone, balance FROM users WHERE id = ?',
            [userId]
        );

        if (rows.length === 0) return res.status(404).json({ message: 'User not found' });

        res.json(rows[0]);
    } catch (err) {
        res.status(500).json({ message: 'Server error', error: err.message });
    }
};

export const getAllUsers = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    try {
        const [rows] = await db.query(
            'SELECT id, phone, balance, created_at FROM users ORDER BY created_at DESC'
        );
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch users', error: err.message });
    }
};

export const getUserCount = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    try {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users');
        res.json({ count: rows[0].total });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user count', error: err.message });
    }
};

export const sendResetPasswordOTP = async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    otpStore.set(phone, otp);
    setTimeout(() => otpStore.delete(phone), 300000);

    try {
        const smsUrl = `https://apihome.in/panel/api/bulksms/?key=${API_KEY}&mobile=${phone}&otp=${otp}`;
        await axios.get(smsUrl);
        res.json({ message: 'OTP sent successfully for password reset' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send OTP', error: err.message });
    }
};

export const verifyResetPasswordOTP = async (req, res) => {
    const { phone, otp, newPassword } = req.body;

    if (!phone || !otp || !newPassword)
        return res.status(400).json({ message: 'Phone, OTP and new password are required' });

    const storedOtp = otpStore.get(phone);
    if (!storedOtp) return res.status(400).json({ message: 'OTP expired or not generated' });
    if (parseInt(otp) !== storedOtp) return res.status(401).json({ message: 'Invalid OTP' });

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await db.query('UPDATE users SET password = ? WHERE phone = ?', [hashedPassword, phone]);

    otpStore.delete(phone);

    res.json({ message: 'Password reset successful' });
};

export const getAdminInfo = (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    res.json({
        phone: req.user.phone,
        adminLevel: req.user.adminLevel || 'standard',
        adminId: req.user.adminId,
        adminName: req.user.adminName,
        isAdmin: true
    });
};

export const deleteUserByAdmin = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    const userId = req.params.id;
    let connection;

    try {
        connection = await db.getConnection();
        await connection.beginTransaction();

        const [users] = await connection.query('SELECT * FROM users WHERE id = ?', [userId]);
        if (users.length === 0) {
            await connection.rollback();
            connection.release();
            return res.status(404).json({ message: 'User not found' });
        }

        const userToDelete = users[0];

        await connection.query('DELETE FROM referral_rewards WHERE referrer_id = ? OR referred_user_id = ?', [userId, userId]);
        await connection.query('DELETE FROM referrals WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM bets WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM transactions WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM withdrawal_requests WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM deposit_requests WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM withdrawals WHERE user_id = ?', [userId]);
        await connection.query('DELETE FROM users WHERE id = ?', [userId]);

        await connection.commit();
        connection.release();

        res.json({
            message: 'User deleted successfully',
            deletedUser: {
                id: userToDelete.id,
                phone: userToDelete.phone
            }
        });

    } catch (err) {
        if (connection) {
            try {
                await connection.rollback();
                connection.release();
            } catch (rollbackError) {
                console.error('Rollback error:', rollbackError);
            }
        }

        console.error('Error deleting user:', err);
        res.status(500).json({ message: 'Server error deleting user', error: err.message });
    }
};
