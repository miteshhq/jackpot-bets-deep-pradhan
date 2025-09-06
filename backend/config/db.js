// config/db.js (Updated with admins table)
import mysql from 'mysql2/promise';
import bcrypt from 'bcrypt';
import dotenv from 'dotenv';
dotenv.config();

const createDatabase = async () => {
    let connection;

    try {
        connection = await mysql.createConnection({
            host: process.env.DB_HOST || 'localhost',
            port: process.env.DB_PORT || 3306,
            user: process.env.DB_USER || 'root',
            password: process.env.DB_PASSWORD || '',
        });

        const databaseName = process.env.DB_NAME || 'jackpot';
        await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${databaseName}\``);
        console.log(`✅ Database '${databaseName}' ready`);
    } catch (error) {
        console.error('❌ Database creation failed:', error);
        throw error;
    } finally {
        if (connection) {
            await connection.end();
        }
    }
};

await createDatabase();

const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'jackpot',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Create all required tables (Updated with admins table)
export const createTables = async () => {
    try {
        console.log('🔄 Creating tables for admin management system...');

        // Admins table (NEW)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS admins (
                id INT AUTO_INCREMENT PRIMARY KEY,
                phone VARCHAR(20) UNIQUE NOT NULL,
                password VARCHAR(255) NOT NULL,
                name VARCHAR(100),
                role ENUM('super', 'admin') DEFAULT 'admin',
                created_by INT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                INDEX idx_phone (phone),
                INDEX idx_role (role),
                FOREIGN KEY (created_by) REFERENCES admins(id) ON DELETE SET NULL
            )
        `);

        // 1. Users table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) UNIQUE,
                phone VARCHAR(20) UNIQUE,
                email VARCHAR(100),
                password VARCHAR(255),
                balance DECIMAL(10,2) DEFAULT 100.00,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_phone (phone)
            )
        `);

        // ... (rest of your existing tables remain the same)
        // 2. Bets table - keeping existing code
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS bets (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                number INT NOT NULL,
                stake DECIMAL(10,2) NOT NULL,
                roundTime VARCHAR(10) NOT NULL,
                barcode VARCHAR(7) NOT NULL,
                status ENUM('pending', 'won', 'lost', 'cancelled') DEFAULT 'pending',
                placedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                INDEX idx_roundTime (roundTime),
                INDEX idx_barcode (barcode),
                INDEX idx_status (status),
                INDEX idx_user_id (user_id)
            )
        `);

        // Add bonus and claimed columns to bets table (existing logic)
        try {
            const [bonusColumns] = await pool.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bets' AND COLUMN_NAME = 'bonus'
            `, [process.env.DB_NAME || 'jackpot']);

            if (bonusColumns.length === 0) {
                await pool.execute(`
                    ALTER TABLE bets 
                    ADD COLUMN bonus DECIMAL(4,2) DEFAULT 1.00 AFTER status
                `);
                console.log('✅ Added bonus column to bets table');
            }
        } catch (bonusError) {
            console.log('ℹ️ Bonus column might already exist or error adding it:', bonusError.message);
        }

        try {
            const [claimedColumns] = await pool.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'bets' AND COLUMN_NAME = 'claimed'
            `, [process.env.DB_NAME || 'jackpot']);

            if (claimedColumns.length === 0) {
                await pool.execute(`
                    ALTER TABLE bets 
                    ADD COLUMN claimed ENUM('claimed', 'unclaimed') DEFAULT 'unclaimed' AFTER bonus
                `);
                console.log('✅ Added claimed column to bets table');
            }
        } catch (claimedError) {
            console.log('ℹ️ Claimed column might already exist or error adding it:', claimedError.message);
        }

        // 3. Results table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS results (
                id INT AUTO_INCREMENT PRIMARY KEY,
                time VARCHAR(10) NOT NULL,
                number INT NOT NULL,
                bonus INT DEFAULT 1,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_time (time),
                INDEX idx_created_at (created_at)
            )
        `);

        // 4. Withdrawals table (legacy)
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS withdrawals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                bank_name VARCHAR(100),
                bank_account_number VARCHAR(50),
                ifsc_code VARCHAR(20),
                amount DECIMAL(10,2) NOT NULL,
                status ENUM('pending', 'approved', 'rejected', 'paid') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                INDEX idx_status (status),
                INDEX idx_user_id (user_id)
            )
        `);

        // 5. Transactions table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS transactions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                withdrawal_id INT DEFAULT NULL,
                amount DECIMAL(10,2) NOT NULL,
                bank_name VARCHAR(100),
                bank_account_number VARCHAR(50),
                ifsc_code VARCHAR(20),
                payment_id VARCHAR(100),
                order_id VARCHAR(100),
                status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                FOREIGN KEY (withdrawal_id) REFERENCES withdrawals(id),
                INDEX idx_user_id (user_id),
                INDEX idx_status (status),
                INDEX idx_payment_id (payment_id)
            )
        `);

        // Check and update 'type' column in transactions table
        try {
            const [columns] = await pool.execute(`
                SELECT COLUMN_NAME 
                FROM INFORMATION_SCHEMA.COLUMNS 
                WHERE TABLE_SCHEMA = ? AND TABLE_NAME = 'transactions' AND COLUMN_NAME = 'type'
            `, [process.env.DB_NAME || 'jackpot']);

            if (columns.length === 0) {
                await pool.execute(`
                    ALTER TABLE transactions 
                    ADD COLUMN type ENUM('deposit', 'withdrawal', 'game', 'manual_credit', 'manual_debit') DEFAULT 'game'
                `);
                console.log('✅ Added type column to transactions table with all enum values');
            } else {
                try {
                    await pool.execute(`
                        ALTER TABLE transactions 
                        MODIFY COLUMN type ENUM('deposit', 'withdrawal', 'game', 'manual_credit', 'manual_debit') DEFAULT 'game'
                    `);
                    console.log('✅ Updated type column enum values in transactions table');
                } catch (enumError) {
                    console.log('ℹ️ Type column enum might already be up to date');
                }
            }
        } catch (err) {
            console.log('ℹ️ Type column handling completed with warnings');
        }

        // 6. Deposit Requests table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS deposit_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                phone_number VARCHAR(15),
                status ENUM('pending', 'approved', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_status (status),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            )
        `);

        // 7. Withdrawal Requests table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS withdrawal_requests (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                bank_name VARCHAR(255),
                bank_account_number VARCHAR(20),
                ifsc_code VARCHAR(11),
                upi_id VARCHAR(100),
                phone_number VARCHAR(15),
                status ENUM('pending', 'completed', 'rejected') DEFAULT 'pending',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
                INDEX idx_status (status),
                INDEX idx_user_id (user_id),
                INDEX idx_created_at (created_at)
            )
        `);

        // 8. Referrals table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS referrals (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id INT NOT NULL,
                code VARCHAR(255) NOT NULL UNIQUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users(id),
                INDEX idx_code (code),
                INDEX idx_user_id (user_id)
            )
        `);

        // 9. Referral Rewards table
        await pool.execute(`
            CREATE TABLE IF NOT EXISTS referral_rewards (
                id INT AUTO_INCREMENT PRIMARY KEY,
                referrer_id INT NOT NULL,
                referred_user_id INT NOT NULL,
                amount DECIMAL(10,2) NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (referrer_id) REFERENCES users(id),
                FOREIGN KEY (referred_user_id) REFERENCES users(id),
                INDEX idx_referrer_id (referrer_id),
                INDEX idx_referenced_user_id (referred_user_id)
            )
        `);

        console.log('✅ All tables created successfully!');

        // Seed default admin
        await seedDefaultAdmin();

        console.log('📊 Created/Updated tables:');
        console.log('   - admins (NEW - admin management)');
        console.log('   - users (authentication)');
        console.log('   - bets (betting system with bonus and claimed columns)');
        console.log('   - results (game results)');
        console.log('   - withdrawals (legacy payout requests)');
        console.log('   - transactions (payment history - updated type enum)');
        console.log('   - deposit_requests (NEW - manual deposit system)');
        console.log('   - withdrawal_requests (NEW - manual withdrawal system)');
        console.log('   - referrals (referral codes)');
        console.log('   - referral_rewards (referral bonuses)');

    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
};

// Seed default admin from environment variables
const seedDefaultAdmin = async () => {
    try {
        const defaultPhone = process.env.DEFAULT_ADMIN_PHONE;
        const defaultPassword = process.env.DEFAULT_ADMIN_PASSWORD;

        if (!defaultPhone || !defaultPassword) {
            console.warn('⚠️ No default admin credentials found in environment variables');
            return;
        }

        // Check if admin already exists
        const [existingAdmin] = await pool.execute(
            'SELECT * FROM admins WHERE phone = ?',
            [defaultPhone]
        );

        if (existingAdmin.length === 0) {
            const hashedPassword = await bcrypt.hash(defaultPassword, 10);
            await pool.execute(
                'INSERT INTO admins (phone, password, name, role) VALUES (?, ?, ?, ?)',
                [defaultPhone, hashedPassword, 'Default Admin', 'super']
            );
            console.log(`✅ Default admin seeded: ${defaultPhone}`);
        } else {
            console.log(`ℹ️ Default admin already exists: ${defaultPhone}`);
        }
    } catch (error) {
        console.error('❌ Error seeding default admin:', error);
    }
};

await createTables();
export default pool;
