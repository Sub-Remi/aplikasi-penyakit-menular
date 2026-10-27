const express = require('express');
const session = require('express-session');
const cors = require('cors');
require('dotenv').config();

const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/user');
const masterRoutes = require('./routes/master');
const kasusRoutes = require('./routes/kasus');
const publikRoutes = require('./routes/publik');
const dashboardRoutes = require('./routes/dashboard');
const artikelRoutes = require('./routes/artikel');
const logRoutes = require('./routes/log');


const app = express();

app.use(cors({
    origin: ['http://localhost:5500', 'http://127.0.0.1:5500'],
    credentials: true
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));
app.use(express.urlencoded({ extended: true }));

app.use(session({
    secret: process.env.SESSION_SECRET || 'rahasia_default',
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: 'lax'
    }
}));

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/master', masterRoutes);
app.use('/api/kasus', kasusRoutes);
app.use('/api/publik', publikRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/artikel', artikelRoutes);
app.use('/api/log', logRoutes);

app.get('/', (req, res) => {
    res.json({ message: "Backend Aplikasi Penyakit Menular berjalan." });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});