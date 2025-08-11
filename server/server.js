const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
require('dotenv').config();

const { initializeDatabase } = require('./database/init');
const authRoutes = require('./routes/auth');
const scanRoutes = require('./routes/scan');
const dashboardRoutes = require('./routes/dashboard');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database
initializeDatabase();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));
// Serve uploads folder statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join(__dirname, 'uploads'));
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: (req, file, cb) => {
        const allowedTypes = /jpeg|jpg|png|gif/;
        const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
        const mimetype = allowedTypes.test(file.mimetype);
        
        if (mimetype && extname) {
            return cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/scan', upload.single('image'), scanRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Serve static files
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

app.get('/login', (req, res) => {
    res.sendFile(path.join(__dirname, '../login-page.html'));
});

app.get('/reset-password', (req, res) => {
    res.sendFile(path.join(__dirname, '../reset-password.html'));
});

// Dashboard route removed - users redirect to homepage after login

app.get('/admin', (req, res) => {
    res.sendFile(path.join(__dirname, '../admin-dashboard.html'));
});

app.get('/scan', (req, res) => {
    res.sendFile(path.join(__dirname, '../scan.html'));
});

app.get('/history', (req, res) => {
    res.sendFile(path.join(__dirname, '../history.html'));
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large' });
        }
    }
    res.status(500).json({ error: error.message });
});

app.listen(PORT, () => {
    console.log(`PharmaLens server running on http://localhost:${PORT}`);
});

module.exports = app;
