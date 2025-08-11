const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../database/init');
const authRouter = require('./auth');
const authenticateToken = authRouter.authenticateToken;

const router = express.Router();

// Middleware to check admin role
const requireAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Admin access required' });
    }
    next();
};

// Get dashboard stats for users
router.get('/stats', authenticateToken, (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    if (req.user.role === 'admin') {
        // Admin stats - all users
        const queries = [
            'SELECT COUNT(*) as totalUsers FROM users WHERE role = "user"',
            'SELECT COUNT(*) as totalScans FROM scan_history',
            'SELECT COUNT(*) as todayScans FROM scan_history WHERE DATE(scan_date) = DATE("now")',
            'SELECT COUNT(*) as thisWeekScans FROM scan_history WHERE DATE(scan_date) >= DATE("now", "-7 days")'
        ];
        
        let stats = {};
        let completed = 0;
        
        queries.forEach((query, index) => {
            db.get(query, (err, row) => {
                if (err) {
                    console.error('Query error:', err);
                } else {
                    Object.assign(stats, row);
                }
                
                completed++;
                if (completed === queries.length) {
                    db.close();
                    res.json({ stats });
                }
            });
        });
    } else {
        // User stats - only their own data
        const queries = [
            `SELECT COUNT(*) as myScans FROM scan_history WHERE user_id = ${req.user.id}`,
            `SELECT COUNT(*) as todayScans FROM scan_history WHERE user_id = ${req.user.id} AND DATE(scan_date) = DATE("now")`,
            `SELECT COUNT(*) as thisWeekScans FROM scan_history WHERE user_id = ${req.user.id} AND DATE(scan_date) >= DATE("now", "-7 days")`
        ];
        
        let stats = {};
        let completed = 0;
        
        queries.forEach((query, index) => {
            db.get(query, (err, row) => {
                if (err) {
                    console.error('Query error:', err);
                } else {
                    Object.assign(stats, row);
                }
                
                completed++;
                if (completed === queries.length) {
                    db.close();
                    res.json({ stats });
                }
            });
        });
    }
});

// Get recent scans (admin can see all, users see only their own)
router.get('/recent-scans', authenticateToken, (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    let query, params;
    
    if (req.user.role === 'admin') {
        query = `
            SELECT sh.id, sh.image_filename, sh.scan_date, u.username
            FROM scan_history sh
            JOIN users u ON sh.user_id = u.id
            ORDER BY sh.scan_date DESC
            LIMIT 10
        `;
        params = [];
    } else {
        query = `
            SELECT id, image_filename, scan_date
            FROM scan_history
            WHERE user_id = ?
            ORDER BY scan_date DESC
            LIMIT 10
        `;
        params = [req.user.id];
    }
    
    db.all(query, params, (err, rows) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch recent scans' });
        }

        res.json({ recentScans: rows });
    });
});

// Admin only: Get all users
router.get('/users', authenticateToken, requireAdmin, (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    db.all(
        'SELECT id, username, email, role, created_at FROM users ORDER BY created_at DESC',
        (err, rows) => {
            db.close();
            
            if (err) {
                return res.status(500).json({ error: 'Failed to fetch users' });
            }

            res.json({ users: rows });
        }
    );
});

// Admin only: Get all scan history
router.get('/all-scans', authenticateToken, requireAdmin, (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    const query = `
        SELECT sh.id, sh.image_filename, sh.ocr_result, sh.ai_analysis, sh.scan_date, u.username
        FROM scan_history sh
        JOIN users u ON sh.user_id = u.id
        ORDER BY sh.scan_date DESC
        LIMIT 100
    `;
    
    db.all(query, (err, rows) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch scan history' });
        }

        res.json({ scans: rows });
    });
});

// Admin only: Delete user
router.delete('/users/:userId', authenticateToken, requireAdmin, (req, res) => {
    const { userId } = req.params;
    
    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ error: 'Cannot delete your own account' });
    }
    
    const db = new sqlite3.Database(DB_PATH);
    
    db.serialize(() => {
        // Delete user's scan history first
        db.run('DELETE FROM scan_history WHERE user_id = ?', [userId]);
        
        // Delete user
        db.run('DELETE FROM users WHERE id = ? AND role != "admin"', [userId], function(err) {
            db.close();
            
            if (err) {
                return res.status(500).json({ error: 'Failed to delete user' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found or cannot delete admin' });
            }

            res.json({ message: 'User deleted successfully' });
        });
    });
});

// Admin only: Update user role
router.put('/users/:userId/role', authenticateToken, requireAdmin, (req, res) => {
    const { userId } = req.params;
    const { role } = req.body;
    
    if (!['user', 'admin'].includes(role)) {
        return res.status(400).json({ error: 'Invalid role' });
    }
    
    if (parseInt(userId) === req.user.id) {
        return res.status(400).json({ error: 'Cannot change your own role' });
    }
    
    const db = new sqlite3.Database(DB_PATH);
    
    db.run(
        'UPDATE users SET role = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
        [role, userId],
        function(err) {
            db.close();
            
            if (err) {
                return res.status(500).json({ error: 'Failed to update user role' });
            }

            if (this.changes === 0) {
                return res.status(404).json({ error: 'User not found' });
            }

            res.json({ message: 'User role updated successfully' });
        }
    );
});

module.exports = router;
