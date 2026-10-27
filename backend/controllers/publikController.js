const db = require('../config/db');

exports.getKasusPublik = async (req, res) => {
    try {
        const query = `
            SELECT 
                k.id, 
                k.periode, 
                k.jumlah, 
                p.nama AS penyakit, 
                w.nama AS wilayah
            FROM kasus k
            JOIN penyakit p ON k.penyakit_id = p.id
            JOIN wilayah w ON k.wilayah_id = w.id
            WHERE k.status = 'Dipublikasikan'
            ORDER BY k.periode DESC, p.nama ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data publik." });
    }
};