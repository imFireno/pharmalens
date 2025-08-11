const express = require('express');
const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const sqlite3 = require('sqlite3').verbose();
const { DB_PATH } = require('../database/init');
const { authenticateToken } = require('./auth');
const { CohereClient } = require('cohere-ai');

const router = express.Router();

// Initialize Cohere client
const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
});

// OCR processing using OCR Space API
async function processOCR(imagePath) {
    try {
        const formData = new FormData();
        formData.append('file', fs.createReadStream(imagePath));
        formData.append('apikey', process.env.OCR_SPACE_API_KEY);
        formData.append('language', 'eng');
        formData.append('isOverlayRequired', 'false');
        formData.append('detectOrientation', 'true');
        formData.append('scale', 'true');

        const response = await axios.post('https://api.ocr.space/parse/image', formData, {
            headers: {
                ...formData.getHeaders(),
            },
            timeout: 30000
        });

        if (response.data.IsErroredOnProcessing) {
            throw new Error(response.data.ErrorMessage || 'OCR processing failed');
        }

        const extractedText = response.data.ParsedResults?.[0]?.ParsedText || '';
        return extractedText.trim();
    } catch (error) {
        console.error('OCR Error:', error.message);
        throw new Error('Failed to process image with OCR');
    }
}

// AI analysis using Cohere
async function analyzeWithCohere(ocrText) {
    try {
        const prompt = `Analisis teks berikut yang diekstrak dari gambar kemasan obat/produk farmasi. Berikan informasi lengkap dan selalu gunakan dalam bahasa Indonesia tentang:

1. Nama Obat dan Kandungan Aktif: Identifikasi nama obat dan zat aktif utama (selalu gunakan bahasa indonesia)
2. Dosis dan Cara Penggunaan: Petunjuk dosis dan cara pemberian obat (selalu gunakan bahasa indonesia)
3. Manfaat: Manfaat dari obat ini (selalu gunakan bahasa indonesia)
4. Kontraindikasi dan Peringatan: Kondisi yang tidak boleh menggunakan obat ini (selalu gunakan bahasa indonesia)
5. Efek Samping: Kemungkinan efek samping yang dapat terjadi (selalu gunakan bahasa indonesia)
6. Cara Penyimpanan: Petunjuk penyimpanan yang benar (selalu gunakan bahasa indonesia)

Teks OCR: "${ocrText}"

PENTING: 
- Jawab HANYA dalam bahasa Indonesia
- Gunakan format yang jelas dengan poin-poin
- Jika teks tidak jelas atau bukan dari kemasan obat, berikan penjelasan dan saran umum
- Berikan peringatan untuk selalu konsultasi dengan dokter atau apoteker
- Gunakan istilah medis yang mudah dipahami masyarakat Indonesia
`;

        const response = await cohere.generate({
            model: 'command',
            prompt: prompt,
            maxTokens: 1000,
            temperature: 0.3,
            k: 0,
            stopSequences: [],
            returnLikelihoods: 'NONE'
        });

        return response.generations[0].text.trim();
    } catch (error) {
        console.error('Cohere AI Error:', error.message);
        throw new Error('Failed to analyze text with AI');
    }
}

// Scan endpoint
router.post('/', authenticateToken, async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No image file provided' });
        }

        const imagePath = req.file.path;
        const filename = req.file.filename;

        // Process OCR
        console.log('Processing OCR...');
        const ocrResult = await processOCR(imagePath);

        if (!ocrResult) {
            return res.status(400).json({ error: 'No text found in image' });
        }

        // Analyze with Cohere AI
        console.log('Analyzing with AI...');
        const aiAnalysis = await analyzeWithCohere(ocrResult);

        // Save to database
        const db = new sqlite3.Database(DB_PATH);
        
        // Use scan_date from frontend (WIB) if provided, else use server time
        let scanDate = null;
        if (req.body && req.body.scan_date) {
            scanDate = req.body.scan_date;
        } else if (req.body && req.body instanceof Object && req.body.get && req.body.get('scan_date')) {
            scanDate = req.body.get('scan_date');
        } else {
            scanDate = new Date().toISOString();
        }
        db.run(
            'INSERT INTO scan_history (user_id, image_filename, ocr_result, ai_analysis, scan_date) VALUES (?, ?, ?, ?, ?)',
            [req.user.id, filename, ocrResult, aiAnalysis, scanDate],
            function(err) {
                db.close();
                
                if (err) {
                    console.error('Database error:', err);
                    return res.status(500).json({ error: 'Failed to save scan result' });
                }

                // Keep the uploaded file for history display
                // Note: File is preserved in uploads folder so it can be displayed in history page

                res.json({
                    success: true,
                    scanId: this.lastID,
                    ocrResult,
                    aiAnalysis,
                    message: 'Image processed successfully'
                });
            }
        );

    } catch (error) {
        console.error('Scan processing error:', error);
        
        // Keep uploaded file even on error for potential debugging
        // Note: Files are preserved in uploads folder

        res.status(500).json({ 
            error: error.message || 'Failed to process image' 
        });
    }
});

// Get scan history for user
router.get('/history', authenticateToken, (req, res) => {
    const db = new sqlite3.Database(DB_PATH);
    
    const query = `
        SELECT id, image_filename, ocr_result, ai_analysis, scan_date 
        FROM scan_history 
        WHERE user_id = ? 
        ORDER BY scan_date DESC 
        LIMIT 50
    `;
    
    db.all(query, [req.user.id], (err, rows) => {
        db.close();
        
        if (err) {
            return res.status(500).json({ error: 'Failed to fetch scan history' });
        }

        res.json({ history: rows });
    });
});

// Get specific scan result
router.get('/:scanId', authenticateToken, (req, res) => {
    const { scanId } = req.params;
    const db = new sqlite3.Database(DB_PATH);
    
    db.get(
        'SELECT * FROM scan_history WHERE id = ? AND user_id = ?',
        [scanId, req.user.id],
        (err, row) => {
            db.close();
            
            if (err) {
                return res.status(500).json({ error: 'Database error' });
            }

            if (!row) {
                return res.status(404).json({ error: 'Scan result not found' });
            }

            res.json({ scan: row });
        }
    );
});

module.exports = router;
