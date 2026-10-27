const db = require('../config/db');

exports.getLog = async (req, res) => {
    try {
        const query = `
            SELECT l.id, l.aktivitas, l.detail, l.created_at, u.nama AS nama_user, u.role
            FROM log_aktivitas l
            JOIN users u ON l.user_id = u.id
            ORDER BY l.id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data log." });
    }
};