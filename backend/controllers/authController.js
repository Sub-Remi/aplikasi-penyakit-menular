const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.login = async (req, res) => {
    const { username, password } = req.body;
    if (!username || !password) return res.status(400).json({ message: "Username dan password wajib diisi." });

    try {
        const [rows] = await db.query("SELECT * FROM users WHERE username = ? LIMIT 1", [username]);
        if (rows.length === 0) return res.status(401).json({ message: "Username atau password salah." });

        const user = rows[0];
        if (user.status !== 'aktif') return res.status(403).json({ message: "Akun tidak aktif." });

        const match = await bcrypt.compare(password, user.password);
        if (!match) return res.status(401).json({ message: "Username atau password salah." });

        req.session.user = {
            id: user.id,
            nama: user.nama,
            username: user.username,
            role: user.role
        };

        await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

        return res.json({ message: "Login berhasil.", user: req.session.user });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) return res.status(500).json({ message: "Gagal logout." });
        res.clearCookie('connect.sid');
        return res.json({ message: "Logout berhasil." });
    });
};

exports.me = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Belum login." });
    }

    try {
        // AMBIL DATA TERBARU DARI DATABASE
        const [rows] = await db.query("SELECT id, nama, username, role FROM users WHERE id = ?", [req.session.user.id]);
        
        if (rows.length === 0) {
            req.session.destroy();
            return res.status(401).json({ message: "User tidak ditemukan." });
        }

        const freshUser = rows[0];

        // Cek jika akun dinonaktifkan
        const [cekStatus] = await db.query("SELECT status FROM users WHERE id = ?", [freshUser.id]);
        if (cekStatus[0].status !== 'aktif') {
            req.session.destroy();
            return res.status(403).json({ message: "Akun telah dinonaktifkan." });
        }

        // Update session dengan data terbaru (agar nama baru tersimpan)
        req.session.user = freshUser;

        return res.json({ user: freshUser });
    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Gagal mengambil data user." });
    }
};