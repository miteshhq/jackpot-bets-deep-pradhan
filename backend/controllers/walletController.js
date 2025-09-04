import db from '../config/db.js';

// ✅ Create deposit request (user side)
export const createDepositRequest = async (req, res) => {
    const { userId, amount, phoneNumber } = req.body;

    if (!userId || !amount || amount < 1) {
        return res.status(400).json({ message: 'Valid user ID and amount required' });
    }

    try {
        await db.query(
            `INSERT INTO deposit_requests (user_id, amount, phone_number, status, created_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
            [userId, amount, phoneNumber]
        );
        res.json({ message: 'Deposit request submitted successfully' });
    } catch (err) {
        console.error('❌ Deposit request error:', err);
        res.status(500).json({ message: 'Failed to create deposit request' });
    }
};

// ✅ Get all deposit requests (admin)
export const getAllDepositRequests = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT dr.*, u.phone as user_phone 
       FROM deposit_requests dr
       LEFT JOIN users u ON dr.user_id = u.id
       ORDER BY dr.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('❌ Failed to fetch deposit requests:', err);
        res.status(500).json({ message: 'Failed to fetch deposit requests' });
    }
};

// ✅ Approve deposit request and add coins (admin)
export const approveDepositRequest = async (req, res) => {
    const { requestId } = req.body;

    try {
        // Get request details
        const [requestRows] = await db.query(
            'SELECT * FROM deposit_requests WHERE id = ? AND status = "pending"',
            [requestId]
        );

        if (!requestRows.length) {
            return res.status(404).json({ message: 'Deposit request not found or already processed' });
        }

        const request = requestRows[0];

        // Start transaction
        await db.query('START TRANSACTION');

        // Update user balance (add coins)
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [request.amount, request.user_id]);

        // Update request status
        await db.query('UPDATE deposit_requests SET status = "approved", updated_at = NOW() WHERE id = ?', [requestId]);

        // Log transaction
        await db.query(
            `INSERT INTO transactions (user_id, amount, type, status, created_at)
       VALUES (?, ?, 'deposit', 'success', NOW())`,
            [request.user_id, request.amount]
        );

        await db.query('COMMIT');
        res.json({ message: 'Deposit request approved and coins added successfully' });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('❌ Error approving deposit:', err);
        res.status(500).json({ message: 'Failed to approve deposit request' });
    }
};

// ✅ Reject deposit request (admin)
export const rejectDepositRequest = async (req, res) => {
    const { requestId } = req.body;

    try {
        const [result] = await db.query(
            'UPDATE deposit_requests SET status = "rejected", updated_at = NOW() WHERE id = ? AND status = "pending"',
            [requestId]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Deposit request not found or already processed' });
        }

        res.json({ message: 'Deposit request rejected' });
    } catch (err) {
        console.error('❌ Error rejecting deposit:', err);
        res.status(500).json({ message: 'Failed to reject deposit request' });
    }
};

// ✅ Create withdrawal request (user side)
export const createWithdrawalRequest = async (req, res) => {
    const { userId, amount, bankName, accountNumber, ifscCode } = req.body;

    if (!userId || !amount || amount < 1 || !bankName || !accountNumber || !ifscCode) {
        return res.status(400).json({ message: 'All fields are required' });
    }

    try {
        // Check user balance
        const [userRows] = await db.query('SELECT balance, phone FROM users WHERE id = ?', [userId]);
        if (!userRows.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userRows[0].balance < amount) {
            return res.status(400).json({ message: 'Insufficient balance' });
        }

        // Create withdrawal request
        await db.query(
            `INSERT INTO withdrawal_requests (user_id, amount, bank_name, bank_account_number, ifsc_code, phone_number, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW())`,
            [userId, amount, bankName, accountNumber, ifscCode, userRows[0].phone]
        );

        res.json({ message: 'Withdrawal request submitted successfully' });
    } catch (err) {
        console.error('❌ Withdrawal request error:', err);
        res.status(500).json({ message: 'Failed to create withdrawal request' });
    }
};

// ✅ Get all withdrawal requests (admin)
export const getAllWithdrawalRequests = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT wr.*, u.phone as user_phone 
       FROM withdrawal_requests wr
       LEFT JOIN users u ON wr.user_id = u.id
       ORDER BY wr.created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('❌ Failed to fetch withdrawal requests:', err);
        res.status(500).json({ message: 'Failed to fetch withdrawal requests' });
    }
};

// ✅ Process withdrawal request (admin)
export const processWithdrawalRequest = async (req, res) => {
    const { requestId, status } = req.body; // status: 'completed' or 'rejected'

    if (!['completed', 'rejected'].includes(status)) {
        return res.status(400).json({ message: 'Invalid status' });
    }

    try {
        // Get request details
        const [requestRows] = await db.query(
            'SELECT * FROM withdrawal_requests WHERE id = ? AND status = "pending"',
            [requestId]
        );

        if (!requestRows.length) {
            return res.status(404).json({ message: 'Withdrawal request not found or already processed' });
        }

        const request = requestRows[0];

        // Start transaction
        await db.query('START TRANSACTION');

        if (status === 'completed') {
            // Deduct amount from user balance
            await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [request.amount, request.user_id]);

            // Log transaction
            await db.query(
                `INSERT INTO transactions (user_id, amount, type, status, created_at)
         VALUES (?, ?, 'withdrawal', 'success', NOW())`,
                [request.user_id, request.amount]
            );
        }

        // Update request status
        await db.query('UPDATE withdrawal_requests SET status = ?, updated_at = NOW() WHERE id = ?', [status, requestId]);

        await db.query('COMMIT');
        res.json({ message: `Withdrawal request ${status} successfully` });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('❌ Error processing withdrawal:', err);
        res.status(500).json({ message: 'Failed to process withdrawal request' });
    }
};

// ✅ Fetch user balance
export const getUserBalance = async (req, res) => {
    const { userId } = req.params;
    try {
        const [rows] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
        if (!rows.length) return res.status(404).json({ message: 'User not found' });
        res.json({ balance: rows[0].balance });
    } catch (err) {
        console.error('Failed to fetch balance:', err);
        res.status(500).json({ message: 'Failed to fetch balance', error: err.message });
    }
};

// ✅ Fetch transaction history for user
export const getUserTransactions = async (req, res) => {
    const { userId } = req.params;
    console.log('Fetching transactions for user:', userId);
    try {
        const [rows] = await db.query(
            `SELECT amount, type, status, created_at
       FROM transactions WHERE user_id = ? ORDER BY created_at DESC`,
            [userId]
        );
        console.log('Transactions fetched:', rows.length);
        res.json(rows);
    } catch (err) {
        console.error('Failed to fetch transactions:', err);
        res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
    }
};

// ✅ Fetch all transactions (admin)
export const getAllTransactions = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT amount, type, status, created_at, user_id
       FROM transactions ORDER BY created_at DESC`
        );
        res.json(rows);
    } catch (err) {
        console.error('Failed to fetch all transactions:', err);
        res.status(500).json({ message: 'Failed to fetch transactions', error: err.message });
    }
};

// ✅ Get total transaction amount
export const getTotalTransactions = async (req, res) => {
    console.log('✅ /transactions/total route hit');
    try {
        const [rows] = await db.query('SELECT SUM(amount) AS totalAmount FROM transactions WHERE status = "success"');
        console.log('Fetched total transaction amount:', rows);
        const totalAmount = rows[0]?.totalAmount || 0;
        res.json({ totalAmount });
    } catch (error) {
        console.error('❌ Error getting total transactions:', error.message);
        res.status(500).json({ message: 'Failed to fetch total transactions' });
    }
};

// ✅ Admin: Manually add coins to user wallet
export const adminAddCoins = async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid userId and positive amount required' });
    }

    try {
        // Check if user exists
        const [userRows] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
        if (!userRows.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Update user balance
        await db.query('UPDATE users SET balance = balance + ? WHERE id = ?', [amount, userId]);

        // Log transaction
        await db.query(
            `INSERT INTO transactions (user_id, amount, type, status, created_at)
       VALUES (?, ?, 'manual_credit', 'success', NOW())`,
            [userId, amount]
        );

        await db.query('COMMIT');
        res.json({ message: `Successfully added ₹${amount} to user ${userId}` });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('❌ Error adding coins:', err);
        res.status(500).json({ message: 'Failed to add coins' });
    }
};

// ✅ Admin: Manually remove coins from user wallet
export const adminRemoveCoins = async (req, res) => {
    const { userId, amount } = req.body;

    if (!userId || !amount || amount <= 0) {
        return res.status(400).json({ message: 'Valid userId and positive amount required' });
    }

    try {
        // Check user balance
        const [userRows] = await db.query('SELECT balance FROM users WHERE id = ?', [userId]);
        if (!userRows.length) {
            return res.status(404).json({ message: 'User not found' });
        }

        if (userRows[0].balance < amount) {
            return res.status(400).json({
                message: `Insufficient balance. User has ₹${userRows[0].balance} but trying to remove ₹${amount}`
            });
        }

        // Start transaction
        await db.query('START TRANSACTION');

        // Update user balance
        await db.query('UPDATE users SET balance = balance - ? WHERE id = ?', [amount, userId]);

        // Log transaction
        await db.query(
            `INSERT INTO transactions (user_id, amount, type, status, created_at)
       VALUES (?, ?, 'manual_debit', 'success', NOW())`,
            [userId, amount]
        );

        await db.query('COMMIT');
        res.json({ message: `Successfully removed ₹${amount} from user ${userId}` });
    } catch (err) {
        await db.query('ROLLBACK');
        console.error('❌ Error removing coins:', err);
        res.status(500).json({ message: 'Failed to remove coins' });
    }
};
