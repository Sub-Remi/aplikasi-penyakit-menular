const db = require('../config/db');

// ==========================================
// 1. FUNGSI UNTUK PENYAKIT
// ==========================================

exports.getPenyakit = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM penyakit ORDER BY id DESC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data penyakit." });
    }
};

exports.createPenyakit = async (req, res) => {
    const { kode, nama, status, batas_hijau, batas_kuning, batas_oranye } = req.body;
    if (!kode || !nama) return res.status(400).json({ message: "Kode dan nama wajib diisi." });

    try {
        const [existing] = await db.query("SELECT kode, nama FROM penyakit WHERE kode = ? OR nama = ?", [kode, nama]);
        if (existing.length > 0) {
            if (existing[0].kode === kode) return res.status(400).json({ message: "Kode penyakit sudah digunakan." });
            if (existing[0].nama === nama) return res.status(400).json({ message: "Nama penyakit sudah ada." });
        }

        await db.query(
            "INSERT INTO penyakit (kode, nama, status, batas_hijau, batas_kuning, batas_oranye) VALUES (?, ?, ?, ?, ?, ?)", 
            [kode, nama, status || 'Aktif', batas_hijau || 50, batas_kuning || 100, batas_oranye || 200]
        );
        res.status(201).json({ message: "Penyakit berhasil ditambahkan." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambahkan penyakit." });
    }
};

exports.updatePenyakit = async (req, res) => {
    const { id } = req.params;
    const { kode, nama, status, batas_hijau, batas_kuning, batas_oranye } = req.body;

    try {
        const [existing] = await db.query("SELECT id, kode, nama FROM penyakit WHERE (kode = ? OR nama = ?) AND id != ?", [kode, nama, id]);
        if (existing.length > 0) {
            if (existing[0].kode === kode) return res.status(400).json({ message: "Kode penyakit sudah digunakan oleh data lain." });
            if (existing[0].nama === nama) return res.status(400).json({ message: "Nama penyakit sudah ada." });
        }

        await db.query(
            "UPDATE penyakit SET kode = ?, nama = ?, status = ?, batas_hijau = ?, batas_kuning = ?, batas_oranye = ? WHERE id = ?", 
            [kode, nama, status, batas_hijau || 50, batas_kuning || 100, batas_oranye || 200, id]
        );
        res.json({ message: "Penyakit berhasil diperbarui." });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui penyakit." });
    }
};

exports.deletePenyakit = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM penyakit WHERE id = ?", [id]);
        res.json({ message: "Penyakit berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus penyakit." });
    }
};

// ==========================================
// 2. FUNGSI UNTUK WILAYAH
// ==========================================

exports.getWilayah = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM wilayah ORDER BY id DESC");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ message: "Gagal mengambil data wilayah." });
    }
};

exports.createWilayah = async (req, res) => {
    const { kode, nama, jenis, status } = req.body;
    try {
        await db.query("INSERT INTO wilayah (kode, nama, jenis, status) VALUES (?, ?, ?, ?)", [kode, nama, jenis, status || 'Aktif']);
        res.status(201).json({ message: "Wilayah berhasil ditambahkan." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menambahkan wilayah." });
    }
};

exports.updateWilayah = async (req, res) => {
    const { id } = req.params;
    const { kode, nama, jenis, status } = req.body;
    try {
        await db.query("UPDATE wilayah SET kode = ?, nama = ?, jenis = ?, status = ? WHERE id = ?", [kode, nama, jenis, status, id]);
        res.json({ message: "Wilayah berhasil diperbarui." });
    } catch (error) {
        res.status(500).json({ message: "Gagal memperbarui wilayah." });
    }
};

exports.deleteWilayah = async (req, res) => {
    const { id } = req.params;
    try {
        await db.query("DELETE FROM wilayah WHERE id = ?", [id]);
        res.json({ message: "Wilayah berhasil dihapus." });
    } catch (error) {
        res.status(500).json({ message: "Gagal menghapus wilayah." });
    }
};