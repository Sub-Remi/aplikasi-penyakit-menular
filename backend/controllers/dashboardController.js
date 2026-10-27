const db = require('../config/db');

exports.getStatistik = async (req, res) => {
    try {
        const [rows] = await db.query(`
            SELECT 
                COUNT(*) AS total,
                SUM(CASE WHEN status = 'Draft' THEN 1 ELSE 0 END) AS draft,
                SUM(CASE WHEN status = 'Menunggu validasi' THEN 1 ELSE 0 END) AS menunggu,
                SUM(CASE WHEN status = 'Dikembalikan' THEN 1 ELSE 0 END) AS dikembalikan,
                SUM(CASE WHEN status = 'Dipublikasikan' THEN 1 ELSE 0 END) AS dipublikasikan
            FROM kasus
        `);
        const stats = rows[0];
        res.json({
            total: stats.total || 0,
            draft: stats.draft || 0,
            menunggu: stats.menunggu || 0,
            dikembalikan: stats.dikembalikan || 0,
            dipublikasikan: stats.dipublikasikan || 0
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil statistik." });
    }
};

exports.getKasusTerbaru = async (req, res) => {
    try {
        const query = `
            SELECT k.id, k.periode, k.jumlah, k.status,
                   p.nama AS penyakit, w.nama AS wilayah
            FROM kasus k
            JOIN penyakit p ON k.penyakit_id = p.id
            JOIN wilayah w ON k.wilayah_id = w.id
            ORDER BY k.id DESC
            LIMIT 5
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data terbaru." });
    }
};