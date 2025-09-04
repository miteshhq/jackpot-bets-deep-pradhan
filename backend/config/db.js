// 📁 config/db.js (Fixed SQL syntax)
import mysql from 'mysql2/promise';
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

// ✅ Create all required tables based on your controllers (FIXED)
export const createTables = async () => {
    try {
        console.log('🔄 Creating tables based on controller analysis...');

        // 1. Users table (authController.js)
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

        // 2. Bets table (betController.js)
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

        // 3. Results table (resultController.js) - FIXED INDEX
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

        // 4. Withdrawals table (payoutController.js)
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

        // 5. Transactions table (razorpayController.js)
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

        // 6. Referrals table (referralController.js)
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

        // 7. Referral Rewards table (authController.js)
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
                INDEX idx_referred_user_id (referred_user_id)
            )
        `);

        console.log('✅ All tables created successfully!');

        // ✅ Log table creation summary
        console.log('📊 Created tables:');
        console.log('   - users (authentication)');
        console.log('   - bets (betting system)');
        console.log('   - results (game results)');
        console.log('   - withdrawals (payout requests)');
        console.log('   - transactions (payment history)');
        console.log('   - referrals (referral codes)');
        console.log('   - referral_rewards (referral bonuses)');

    } catch (error) {
        console.error('❌ Error creating tables:', error);
        throw error;
    }
};

// ✅ Only call createTables here, not in server.js
await createTables();

export default pool;
