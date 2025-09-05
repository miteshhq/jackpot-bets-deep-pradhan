import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import axios from 'axios';

const API_KEY = 'f4d751b8c1f8d5c3208e3ca6c998c7da73198'; // SMS API key
const otpStore = new Map();
const generateOTP = () => Math.floor(100000 + Math.random() * 900000);

// ✅ Parse admin credentials from environment variables
const parseAdminCredentials = () => {
    const adminCredsString = process.env.ADMIN_CREDENTIALS;
    if (!adminCredsString) {
        console.warn('⚠️ No ADMIN_CREDENTIALS found in environment variables');
        return [];
    }

    try {
        return adminCredsString.split(',').map(cred => {
            const [phone, password] = cred.trim().split(':');
            if (!phone || !password) {
                throw new Error(`Invalid admin credential format: ${cred}`);
            }
            return { phone: phone.trim(), password: password.trim() };
        });
    } catch (error) {
        console.error('❌ Error parsing admin credentials:', error.message);
        return [];
    }
};

// Get admin credentials on startup
const adminCredentials = parseAdminCredentials();
console.log(`✅ Loaded ${adminCredentials.length} admin accounts`);

// ✅ Helper function to check if user is admin
const isAdmin = (phone, password) => {
    return adminCredentials.some(admin =>
        admin.phone === phone && admin.password === password
    );
};

// ✅ Send OTP
export const sendUserOTP = async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    const otp = generateOTP();
    otpStore.set(phone, otp);
    setTimeout(() => otpStore.delete(phone), 300000); // OTP expires in 5 minutes

    try {
        const smsUrl = `https://apihome.in/panel/api/bulksms/?key=${API_KEY}&mobile=${phone}&otp=${otp}`;
        await axios.get(smsUrl);
        res.json({ message: 'OTP sent successfully' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send OTP', error: err.message });
    }
};

// ✅ Verify OTP and Register New User with ₹20 balance + referral reward
export const verifyUserOTP = async (req, res) => {
    const { phone, otp, password, referralCode } = req.body;

    // Validate inputs
    if (!phone || !otp || !password)
        return res.status(400).json({ message: 'Phone, OTP and password are required' });

    // Check OTP correctness & expiration
    const storedOtp = otpStore.get(phone);
    if (!storedOtp) return res.status(400).json({ message: 'OTP expired or not generated' });
    if (parseInt(otp) !== storedOtp) return res.status(401).json({ message: 'Invalid OTP' });

    // Check if user already exists
    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length > 0) {
        return res.status(409).json({ message: 'User already exists. Please login.' });
    }

    // Hash password & insert new user with ₹20 balance
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.query(
        'INSERT INTO users (phone, password, balance) VALUES (?, ?, ?)',
        [phone, hashedPassword, 20]
    );

    const newUserId = result.insertId;

    // Referral Bonus Logic
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

// ✅ User Login (includes Multiple Admin check)
export const loginUser = async (req, res) => {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Phone and password are required' });

    // ✅ Multiple Admin login check
    if (isAdmin(phone, password)) {
        const token = jwt.sign({
            admin: true,
            phone: phone,
            adminLevel: 'super' // You can add different admin levels if needed
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

// ✅ Admin Login (separate route - now supports multiple admins)
export const loginAdmin = (req, res) => {
    const { phone, password } = req.body;

    console.log('Admin login attempt for phone:', phone);

    if (!isAdmin(phone, password)) {
        return res.status(403).json({ message: 'Unauthorized - Invalid admin credentials' });
    }

    const token = jwt.sign({
        admin: true,
        phone: phone,
        adminLevel: 'super'
    }, process.env.JWT_SECRET, { expiresIn: '2h' });

    console.log('✅ Admin login successful for:', phone);
    res.json({ token, message: 'Admin login successful' });
};

// ✅ Middleware: Token Verification
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

// ✅ Get User Data
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

// ✅ Admin: Get All Users
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

// ✅ Admin: Get User Count
export const getUserCount = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    try {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM users');
        res.json({ count: rows[0].total });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch user count', error: err.message });
    }
};

// Send OTP for password reset
export const sendResetPasswordOTP = async (req, res) => {
    const { phone } = req.body;
    if (!phone) return res.status(400).json({ message: 'Phone number is required' });

    // Check if user exists
    const [users] = await db.query('SELECT * FROM users WHERE phone = ?', [phone]);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });

    const otp = generateOTP();
    otpStore.set(phone, otp);
    setTimeout(() => otpStore.delete(phone), 300000); // OTP expires in 5 minutes

    try {
        const smsUrl = `https://apihome.in/panel/api/bulksms/?key=${API_KEY}&mobile=${phone}&otp=${otp}`;
        await axios.get(smsUrl);
        res.json({ message: 'OTP sent successfully for password reset' });
    } catch (err) {
        res.status(500).json({ message: 'Failed to send OTP', error: err.message });
    }
};

// Verify OTP and reset password
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

// ✅ Get current admin info (useful for display)
export const getAdminInfo = (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    res.json({
        phone: req.user.phone,
        adminLevel: req.user.adminLevel || 'standard',
        isAdmin: true
    });
};
