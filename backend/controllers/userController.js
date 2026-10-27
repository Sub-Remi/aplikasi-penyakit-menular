const db = require('../config/db');
const bcrypt = require('bcrypt');

// 1. Ambil semua data user (tanpa password)
exports.getUsers = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT id, nama, username, role, status, last_login FROM users ORDER BY id DESC");
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data user." });
    }
};

// 2. Tambah user baru
exports.createUser = async (req, res) => {
    const { nama, username, password, role } = req.body;

    if (!nama || !username || !password || !role) {
        return res.status(400).json({ message: "Semua kolom wajib diisi." });
    }

    try {
        // Cek username sudah ada atau belum
        const [existing] = await db.query("SELECT id FROM users WHERE username = ?", [username]);
        if (existing.length > 0) {
            return res.status(400).json({ message: "Username sudah digunakan." });
        }

        // Enkripsi password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan ke database
        await db.query(
            "INSERT INTO users (nama, username, password, role, status) VALUES (?, ?, ?, ?, 'aktif')",
            [nama, username, hashedPassword, role]
        );

        res.status(201).json({ message: "Akun berhasil ditambahkan." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal menambahkan akun." });
    }
};

// 3. Edit data user
exports.updateUser = async (req, res) => {
    const { id } = req.params;
    const { nama, username, role, status } = req.body;

    try {
        await db.query(
            "UPDATE users SET nama = ?, username = ?, role = ?, status = ? WHERE id = ?",
            [nama, username, role, status, id]
        );
        res.json({ message: "Akun berhasil diperbarui." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal memperbarui akun." });
    }
};

// 4. Reset password user
exports.resetPassword = async (req, res) => {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
        return res.status(400).json({ message: "Password baru wajib diisi." });
    }

    try {
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        await db.query("UPDATE users SET password = ? WHERE id = ?", [hashedPassword, id]);
        res.json({ message: "Password berhasil direset." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mereset password." });
    }
};

// 5. Hapus user
exports.deleteUser = async (req, res) => {
    const { id } = req.params;

    try {
        // Cegah admin menghapus akunnya sendiri (opsional, tapi disarankan)
        // if (req.session.user.id === parseInt(id)) {
        //     return res.status(400).json({ message: "Anda tidak dapat menghapus akun sendiri." });
        // }

        await db.query("DELETE FROM users WHERE id = ?", [id]);
        res.json({ message: "Akun berhasil dihapus." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal menghapus akun." });
    }
};