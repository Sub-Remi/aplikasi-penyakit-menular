const db = require('../config/db');

// 1. Ambil data kasus yang sudah dipublikasikan (Untuk Masyarakat)
exports.getKasusPublik = async (req, res) => {
    try {
        const query = `
            SELECT k.id, k.periode, k.jumlah, p.nama AS penyakit, w.nama AS wilayah
            FROM kasus k
            JOIN penyakit p ON k.penyakit_id = p.id
            JOIN wilayah w ON k.wilayah_id = w.id
            WHERE k.status = 'Dipublikasikan'
            ORDER BY k.id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data publik." });
    }
};

// 2. Ambil statistik ringkasan untuk Beranda Masyarakat
exports.getStatistikPublik = async (req, res) => {
    try {
        // Hitung total kasus dari data yang dipublikasikan
        const [totalKasus] = await db.query("SELECT SUM(jumlah) AS total FROM kasus WHERE status = 'Dipublikasikan'");
        
        // Hitung berapa banyak jenis penyakit dan wilayah yang terdampak
        const [totalPenyakit] = await db.query("SELECT COUNT(DISTINCT penyakit_id) AS total FROM kasus WHERE status = 'Dipublikasikan'");
        const [totalWilayah] = await db.query("SELECT COUNT(DISTINCT wilayah_id) AS total FROM kasus WHERE status = 'Dipublikasikan'");

        res.json({
            totalKasus: totalKasus[0].total || 0,
            totalPenyakit: totalPenyakit[0].total || 0,
            totalWilayah: totalWilayah[0].total || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil statistik publik." });
    }
};