import bcrypt from 'bcrypt';
import db from '../config/db.js';

// Get all admins
export const getAllAdmins = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    try {
        const [rows] = await db.query(`
            SELECT a.id, a.phone, a.name, a.role, a.created_at,
                   ca.phone as created_by_phone, ca.name as created_by_name
            FROM admins a
            LEFT JOIN admins ca ON a.created_by = ca.id
            ORDER BY a.created_at DESC
        `);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch admins', error: err.message });
    }
};

// Create new admin
export const createAdmin = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    const { phone, password, name, role = 'admin' } = req.body;

    if (!phone || !password || !name) {
        return res.status(400).json({ message: 'Phone, password, and name are required' });
    }

    if (!['admin', 'super'].includes(role)) {
        return res.status(400).json({ message: 'Invalid role. Must be admin or super' });
    }

    try {
        // Check if admin with this phone already exists
        const [existingAdmin] = await db.query('SELECT * FROM admins WHERE phone = ?', [phone]);
        if (existingAdmin.length > 0) {
            return res.status(409).json({ message: 'Admin with this phone already exists' });
        }

        // Get current admin ID
        const [currentAdmin] = await db.query('SELECT id FROM admins WHERE phone = ?', [req.user.phone]);
        const createdById = currentAdmin.length > 0 ? currentAdmin[0].id : null;

        const hashedPassword = await bcrypt.hash(password, 10);
        const [result] = await db.query(
            'INSERT INTO admins (phone, password, name, role, created_by) VALUES (?, ?, ?, ?, ?)',
            [phone, hashedPassword, name, role, createdById]
        );

        res.json({
            message: 'Admin created successfully',
            admin: {
                id: result.insertId,
                phone,
                name,
                role
            }
        });
    } catch (err) {
        console.error('❌ Error creating admin:', err);
        res.status(500).json({ message: 'Failed to create admin', error: err.message });
    }
};

// Update admin
export const updateAdmin = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    const { id } = req.params;
    const { phone, password, name, role } = req.body;

    if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Valid admin ID is required' });
    }

    try {
        // Check if admin exists
        const [existingAdmin] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
        if (existingAdmin.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Build update query dynamically
        let updateFields = [];
        let updateValues = [];

        if (phone) {
            // Check if phone is already used by another admin
            const [phoneCheck] = await db.query('SELECT * FROM admins WHERE phone = ? AND id != ?', [phone, id]);
            if (phoneCheck.length > 0) {
                return res.status(409).json({ message: 'Phone number already used by another admin' });
            }
            updateFields.push('phone = ?');
            updateValues.push(phone);
        }

        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            updateValues.push(hashedPassword);
        }

        if (name) {
            updateFields.push('name = ?');
            updateValues.push(name);
        }

        if (role && ['admin', 'super'].includes(role)) {
            updateFields.push('role = ?');
            updateValues.push(role);
        }

        if (updateFields.length === 0) {
            return res.status(400).json({ message: 'No valid fields to update' });
        }

        updateValues.push(id);

        await db.query(
            `UPDATE admins SET ${updateFields.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
            updateValues
        );

        res.json({ message: 'Admin updated successfully' });
    } catch (err) {
        console.error('❌ Error updating admin:', err);
        res.status(500).json({ message: 'Failed to update admin', error: err.message });
    }
};

// Delete admin
export const deleteAdmin = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    const { id } = req.params;

    if (!id || isNaN(id)) {
        return res.status(400).json({ message: 'Valid admin ID is required' });
    }

    try {
        // Check if admin exists
        const [existingAdmin] = await db.query('SELECT * FROM admins WHERE id = ?', [id]);
        if (existingAdmin.length === 0) {
            return res.status(404).json({ message: 'Admin not found' });
        }

        // Check total admin count - must have at least 1 admin
        const [adminCount] = await db.query('SELECT COUNT(*) as total FROM admins');
        if (adminCount[0].total <= 1) {
            return res.status(400).json({ message: 'Cannot delete the last admin. At least one admin must remain.' });
        }

        // Delete admin
        await db.query('DELETE FROM admins WHERE id = ?', [id]);

        res.json({ message: 'Admin deleted successfully' });
    } catch (err) {
        console.error('❌ Error deleting admin:', err);
        res.status(500).json({ message: 'Failed to delete admin', error: err.message });
    }
};

// Get admin count
export const getAdminCount = async (req, res) => {
    if (!req.user?.admin) return res.status(403).json({ message: 'Access denied' });

    try {
        const [rows] = await db.query('SELECT COUNT(*) as total FROM admins');
        res.json({ count: rows[0].total });
    } catch (err) {
        res.status(500).json({ message: 'Failed to fetch admin count', error: err.message });
    }
};
