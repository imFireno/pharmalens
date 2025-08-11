const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../database/init');

const router = express.Router();

// Middleware to verify JWT token
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ error: 'Access token required' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ error: 'Invalid token' });
        }
        req.user = user;
        next();
    });
};

// Login endpoint
router.post('/login', (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ error: 'Username dan password diperlukan' });
    }

    const db = new sqlite3.Database(DB_PATH);
    
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, username], (err, user) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            db.close();
            return res.status(401).json({ error: 'Username atau password salah' });
        }

        bcrypt.compare(password, user.password, (err, isMatch) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Kesalahan autentikasi' });
            }

            if (!isMatch) {
                db.close();
                return res.status(401).json({ error: 'Username atau password salah' });
            }

            const token = jwt.sign(
                { 
                    id: user.id, 
                    username: user.username, 
                    role: user.role 
                },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );

            db.close();
            res.json({
                message: 'Login successful',
                token,
                user: {
                    id: user.id,
                    username: user.username,
                    email: user.email,
                    role: user.role
                }
            });
        });
    });
});

// Register endpoint
router.post('/register', (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }

    if (password.length < 6) {
        return res.status(400).json({ error: 'Password must be at least 6 characters' });
    }

    const db = new sqlite3.Database(DB_PATH);
    
    // Check if user already exists
    db.get('SELECT * FROM users WHERE username = ? OR email = ?', [username, email], (err, existingUser) => {
        if (err) {
            db.close();
            return res.status(500).json({ error: 'Database error' });
        }

        if (existingUser) {
            db.close();
            return res.status(409).json({ error: 'Username or email already exists' });
        }

        // Hash password and create user
        bcrypt.hash(password, 10, (err, hashedPassword) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Password hashing error' });
            }

            db.run(
                'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
                [username, email, hashedPassword, 'user'],
                function(err) {
                    if (err) {
                        db.close();
                        return res.status(500).json({ error: 'Failed to create user' });
                    }

                    const token = jwt.sign(
                        { 
                            id: this.lastID, 
                            username, 
                            role: 'user' 
                        },
                        process.env.JWT_SECRET,
                        { expiresIn: '24h' }
                    );

                    db.close();
                    res.status(201).json({
                        message: 'User created successfully',
                        token,
                        user: {
                            id: this.lastID,
                            username,
                            email,
                            role: 'user'
                        }
                    });
                }
            );
        });
    });
});

// Get current user info
router.get('/me', authenticateToken, (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.get('SELECT id, username, email, role, created_at FROM users WHERE id = ?', [req.user.id], (err, user) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Database error' });
        }

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user });
    });
});

// Logout endpoint (client-side token removal)
router.post('/logout', (req, res) => {
    // Since we're using JWT tokens, logout is handled on the client side
    // by removing the token from localStorage
    res.json({ message: 'Logged out successfully' });
});

// Forgot password endpoint
router.post('/forgot-password', async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ error: 'Email diperlukan' });
        }

        const db = new sqlite3.Database(DB_PATH);

        // Check if user exists
        db.get('SELECT id, username, email FROM users WHERE email = ?', [email], async (err, user) => {
            if (err) {
                db.close();
                return res.status(500).json({ error: 'Database error' });
            }

            if (!user) {
                db.close();
                // Don't reveal if email exists or not for security
                return res.json({ message: 'Jika email terdaftar, link reset password akan dikirim ke email Anda' });
            }

            // Generate reset token
            const resetToken = crypto.randomBytes(32).toString('hex');
            const expiresAt = new Date(Date.now() + 3600000); // 1 hour from now

            // Save reset token to database
            db.run(
                'INSERT INTO password_reset_tokens (user_id, token, expires_at) VALUES (?, ?, ?)',
                [user.id, resetToken, expiresAt.toISOString()],
                function(err) {
                    db.close();
                    
                    if (err) {
                        return res.status(500).json({ error: 'Gagal membuat token reset' });
                    }

                    // In a real app, you would send an email here
                    // For now, we'll return the token for testing purposes
                    res.json({ 
                        message: 'Jika email terdaftar, link reset password akan dikirim ke email Anda',
                        // Remove this in production - only for testing
                        resetToken: resetToken,
                        resetUrl: `http://localhost:3000/reset-password?token=${resetToken}`
                    });
                }
            );
        });
    } catch (error) {
        console.error('Forgot password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

// Reset password endpoint
router.post('/reset-password', async (req, res) => {
    try {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ error: 'Token dan password baru diperlukan' });
        }

        if (newPassword.length < 6) {
            return res.status(400).json({ error: 'Password minimal 6 karakter' });
        }

        const db = new sqlite3.Database(DB_PATH);

        // Check if token is valid and not expired
        db.get(
            `SELECT prt.*, u.id as user_id, u.email 
             FROM password_reset_tokens prt 
             JOIN users u ON prt.user_id = u.id 
             WHERE prt.token = ? AND prt.used = FALSE AND prt.expires_at > datetime('now')`,
            [token],
            async (err, tokenData) => {
                if (err) {
                    db.close();
                    return res.status(500).json({ error: 'Database error' });
                }

                if (!tokenData) {
                    db.close();
                    return res.status(400).json({ error: 'Token tidak valid atau sudah kadaluarsa' });
                }

                // Hash new password
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                // Update user password
                db.run(
                    'UPDATE users SET password = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
                    [hashedPassword, tokenData.user_id],
                    function(err) {
                        if (err) {
                            db.close();
                            return res.status(500).json({ error: 'Gagal mengupdate password' });
                        }

                        // Mark token as used
                        db.run(
                            'UPDATE password_reset_tokens SET used = TRUE WHERE token = ?',
                            [token],
                            function(err) {
                                db.close();
                                
                                if (err) {
                                    console.error('Error marking token as used:', err);
                                }

                                res.json({ message: 'Password berhasil direset. Silakan login dengan password baru Anda.' });
                            }
                        );
                    }
                );
            }
        );
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
