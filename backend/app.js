const express = require('express');
const session = require('express-session');
const MySQLStore = require('express-mysql-session')(session);
const cors = require('cors');
const path = require('path');
require('dotenv').config();

// Import Routes
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const masterRoutes = require('./routes/master');
const kasusRoutes = require('./routes/kasus');
const publikRoutes = require('./routes/publik');
const logRoutes = require('./routes/log');
const dashboardRoutes = require('./routes/dashboard');
const artikelRoutes = require('./routes/artikel');

const app = express();

// --- 1. SESSION STORE (Disimpan di MySQL) ---
const sessionStore = new MySQLStore({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    createDatabaseTable: true, // Otomatis buat tabel 'sessions' jika belum ada
    schema: {
        tableName: 'sessions',
        columnNames: {
            session_id: 'session_id',
            expires: 'expires',
            data: 'data'
        }
    }
});

// --- 2. MIDDLEWARE ---
app.use(cors({
    origin: ['http://localhost:3000', 'http://127.0.0.1:3000'],
    credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'rahasia_super_aman',
    store: sessionStore, // Gunakan MySQL store
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
        maxAge: 1000 * 60 * 60 * 8 // 8 jam
    }
}));

// --- 3. SERVE FRONTEND (Express jadi web server untuk FE juga) ---
// Menyajikan semua file di folder 'frontend'
app.use(express.static(path.join(__dirname, '../frontend')));

// Menyajikan folder uploads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- 4. ROUTES API ---
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/kasus', kasusRoutes);
app.use('/api/publik', publikRoutes);
app.use('/api/log', logRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/artikel', artikelRoutes);

// --- 5. REDIRECT HALAMAN AWAL ---
// Jika buka http://localhost:3000/, langsung ke halaman masyarakat
app.get('/', (req, res) => {
    res.redirect('/Masyarakat/index.html');
});

// --- 6. JALANKAN SERVER ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`===========================================`);
    console.log(`  Server berjalan di http://localhost:${PORT}`);
    console.log(`  Buka aplikasi di: http://localhost:${PORT}`);
    console.log(`===========================================`);
});