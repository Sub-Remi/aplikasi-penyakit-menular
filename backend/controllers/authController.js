const bcrypt = require('bcrypt');
const db = require('../config/db');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ message: "Username dan password wajib diisi." });
    }

    try {
        const [rows] = await db.query(
            "SELECT * FROM users WHERE username = ? LIMIT 1",
            [username]
        );

        if (rows.length === 0) {
            return res.status(401).json({ message: "Username atau password salah." });
        }

        const user = rows[0];

        if (user.status !== 'aktif') {
            return res.status(403).json({ message: "Akun tidak aktif." });
        }

        const match = await bcrypt.compare(password, user.password);
        if (!match) {
            return res.status(401).json({ message: "Username atau password salah." });
        }

        req.session.user = {
            id: user.id,
            nama: user.nama,
            username: user.username,
            role: user.role
        };

        await db.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

        return res.json({
            message: "Login berhasil.",
            user: req.session.user
        });

    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: "Terjadi kesalahan pada server." });
    }
};

exports.logout = (req, res) => {
    req.session.destroy(err => {
        if (err) {
            return res.status(500).json({ message: "Gagal logout." });
        }
        res.clearCookie('connect.sid');
        return res.json({ message: "Logout berhasil." });
    });
};

exports.me = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Belum login." });
    }

    try {
        // 1. Ambil data user TERBARU dari database
        const [rows] = await db.query("SELECT * FROM users WHERE id = ?", [req.session.user.id]);
        
        if (rows.length === 0) {
            // Jika user sudah dihapus dari database
            req.session.destroy();
            return res.status(401).json({ message: "Akun tidak ditemukan." });
        }

        const user = rows[0];

        // 2. Cek apakah akun masih aktif
        if (user.status !== 'aktif') {
            req.session.destroy(); // Hancurkan session
            return res.status(403).json({ message: "Akun telah dinonaktifkan." });
        }

        // 3. Cek apakah role masih sama dengan yang ada di session
        if (user.role !== req.session.user.role) {
            req.session.destroy(); // Hancurkan session
            return res.status(403).json({ message: "Role akun telah berubah. Silakan login ulang." });
        }

        // Jika semua aman, kembalikan data user
        return res.json({ user: req.session.user });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ message: "Terjadi kesalahan server." });
    }
};