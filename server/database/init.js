const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcryptjs');
const path = require('path');

const DB_PATH = path.join(__dirname, 'pharmalens.db');

// Initialize database
function initializeDatabase() {
    const db = new sqlite3.Database(DB_PATH);
    
    // Create users table
    db.serialize(() => {
        // Users table
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password TEXT NOT NULL,
            role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin')),
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )`);

        // Scan history table
        db.run(`CREATE TABLE IF NOT EXISTS scan_history (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            image_filename TEXT NOT NULL,
            ocr_result TEXT,
            ai_analysis TEXT,
            scan_date DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Password reset tokens table
        db.run(`CREATE TABLE IF NOT EXISTS password_reset_tokens (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            token TEXT UNIQUE NOT NULL,
            expires_at DATETIME NOT NULL,
            used BOOLEAN DEFAULT FALSE,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )`);

        // Create default admin user
        const adminPassword = bcrypt.hashSync('admin123', 10);
        db.run(`INSERT OR IGNORE INTO users (username, email, password, role) 
                VALUES ('admin', 'admin@pharmalens.com', ?, 'admin')`, [adminPassword]);

        // Create default test user
        const userPassword = bcrypt.hashSync('user123', 10);
        db.run(`INSERT OR IGNORE INTO users (username, email, password, role) 
                VALUES ('testuser', 'user@pharmalens.com', ?, 'user')`, [userPassword]);
    });

    db.close();
    console.log('Database initialized successfully');
}

module.exports = { initializeDatabase, DB_PATH };
