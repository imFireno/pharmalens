# PharmaLens

PharmaLens adalah aplikasi web untuk membantu pengguna melakukan scan label obat menggunakan teknologi OCR dan AI, menyimpan riwayat scan (beserta foto hasil scan), serta mengelola pengguna dengan sistem role user dan admin.

---

## ✨ Fitur Utama
- **Scan Obat dengan OCR**: Upload foto label obat, ekstraksi teks otomatis.
- **Analisis AI**: Hasil scan dianalisis menggunakan Cohere AI untuk insight obat.
- **Riwayat Scan**: Semua hasil scan (termasuk foto) tersimpan dan dapat dilihat kembali.
- **Notifikasi Login Spektakuler**: Animasi login sukses/gagal yang menarik.
- **Role User & Admin**: Admin dapat melihat seluruh data, user hanya data pribadi.
- **Lupa Password/Reset Password**: Reset password via email/token.
- **Pencarian & Filter Riwayat**: Cari hasil scan berdasarkan teks atau tanggal.

---

## ⚙️ Teknologi yang Digunakan
- **Frontend**: HTML, CSS (Tailwind CSS), JavaScript, Animate.css, Font Awesome, AOS
- **Backend**: Node.js, Express.js, Multer (upload), SQLite (database), bcryptjs (hash), jsonwebtoken (auth)
- **API Eksternal**: OCR Space (OCR), Cohere AI (analisis teks)

---

## 🚦 Cara Menjalankan Project
1. **Clone repo** dan install dependencies:
   ```bash
   npm install
   cd server && npm install
   ```
2. **Copy file .env.example menjadi .env** di folder `server/` dan isi dengan API key serta konfigurasi yang sesuai.
3. **Jalankan backend** (dari folder `server/`):
   ```bash
   npm start
   # atau
   npm run dev
   ```
4. **Jalankan frontend** (dari root project):
   ```bash
   # Untuk tailwind (jika ingin rebuild CSS)
   npm run dev
   ```
5. **Akses aplikasi** di browser: [http://localhost:3000](http://localhost:3000)

---

## 🌱 Environment (.env)
Contoh konfigurasi di `server/.env`:
```env
# OCR Space API Configuration
OCR_SPACE_API_KEY=your_ocr_space_api_key_here

# Cohere AI Configuration
COHERE_API_KEY=your_cohere_api_key_here

# JWT Secret for authentication
JWT_SECRET=your_jwt_secret_key_here

# Server Configuration
PORT=3000
NODE_ENV=development

# Database Configuration
DB_PATH=./database/pharmalens.db
```
- **Catatan:**
  - Dapatkan API key OCR Space di https://ocr.space/ocrapi
  - Dapatkan API key Cohere AI di https://dashboard.cohere.com/api-keys

---

## 📋 Struktur Folder
- `index.html, login-page.html, scan.html, history.html, admin-dashboard.html`: Frontend utama
- `js/`: Script frontend
- `server/`: Backend Node.js/Express
- `server/routes/`: API routes (auth, scan, dashboard)
- `server/database/`: Init dan file database SQLite
- `server/uploads/`: Tempat penyimpanan file gambar hasil scan
- `src/`: CSS (Tailwind)

---

## 👨‍💻 Kontribusi & Lisensi
Open source, MIT License. Silakan kontribusi atau modifikasi sesuai kebutuhan.


### Frontend
- HTML5, CSS3, JavaScript (ES6+)
- Tailwind CSS untuk styling
- Font Awesome untuk ikon
- Animate.css & AOS untuk animasi

### Backend
- Node.js dengan Express.js
- SQLite untuk database
- JWT untuk autentikasi
- Multer untuk upload file
- BCrypt untuk hashing password

### API Eksternal
- OCR Space API untuk OCR processing
- Cohere AI untuk analisis teks


```

### 4. Mendapatkan API Keys

#### OCR Space API Key
1. Kunjungi [OCR Space](https://ocr.space/ocrapi)
2. Daftar untuk mendapatkan free API key
3. Masukkan API key ke file `.env`

#### Cohere AI API Key
1. Kunjungi [Cohere](https://cohere.ai/)
2. Daftar dan buat API key
3. Masukkan API key ke file `.env`

### 5. Jalankan Aplikasi

#### Compile Tailwind CSS (Terminal 1)
```bash
npm run dev
```

#### Start Backend Server (Terminal 2)
```bash
cd server
npm run dev
```

### 6. Akses Aplikasi

- **Homepage**: http://localhost:3000
- **Login**: http://localhost:3000/login
- **User Dashboard**: http://localhost:3000/dashboard
- **Admin Dashboard**: http://localhost:3000/admin

## Default User Accounts

Sistem akan otomatis membuat akun default:

### Admin Account
- **Username**: admin
- **Email**: admin@pharmalens.com
- **Password**: admin123

### Test User Account
- **Username**: testuser
- **Email**: user@pharmalens.com
- **Password**: user123

## Struktur Proyek

```
pharmalens-main/
├── server/                 # Backend aplikasi
│   ├── database/          # Database setup dan file SQLite
│   ├── routes/            # API routes
│   ├── uploads/           # Temporary file uploads
│   ├── server.js          # Main server file
│   └── package.json       # Backend dependencies
├── js/                    # JavaScript files
├── src/                   # CSS files (Tailwind)
├── img/                   # Image assets
├── index.html             # Homepage
├── login-page.html        # Login page
├── dashboard.html         # User dashboard
├── admin-dashboard.html   # Admin dashboard
└── package.json           # Frontend dependencies
```

## Cara Penggunaan

### Untuk User
1. Daftar akun baru atau login dengan akun yang ada
2. Upload gambar obat di halaman utama
3. Tunggu proses OCR dan analisis AI
4. Lihat hasil analisis dan riwayat scan di dashboard

### Untuk Admin
1. Login dengan akun admin
2. Akses admin dashboard untuk melihat:
   - Statistik sistem
   - Manajemen user
   - Riwayat scan semua user
3. Kelola user (ubah role, hapus user)

## Troubleshooting

### Common Issues

1. **OCR tidak berfungsi**
   - Pastikan OCR Space API key valid
   - Periksa koneksi internet
   - Pastikan gambar berformat yang didukung (JPG, PNG, GIF)

2. **AI Analysis gagal**
   - Pastikan Cohere API key valid
   - Periksa quota API Cohere

3. **Database error**
   - Pastikan folder `server/database/` ada
   - Restart server untuk reinitialize database

4. **Login gagal**
   - Periksa username/password
   - Pastikan database sudah terinisialisasi

## Kontribusi

1. Fork repository
2. Buat branch feature (`git checkout -b feature/AmazingFeature`)
3. Commit perubahan (`git commit -m 'Add some AmazingFeature'`)
4. Push ke branch (`git push origin feature/AmazingFeature`)
5. Buat Pull Request

## Lisensi

Distributed under the MIT License. See `LICENSE` for more information.

## Support

Jika mengalami masalah atau memiliki pertanyaan, silakan buat issue di repository ini.
