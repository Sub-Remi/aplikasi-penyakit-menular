const db = require('../config/db');

// Fungsi bantuan untuk mencatat log
const catatLog = async (userId, aktivitas, detail) => {
    try {
        await db.query("INSERT INTO log_aktivitas (user_id, aktivitas, detail) VALUES (?, ?, ?)", [userId, aktivitas, detail]);
    } catch (error) {
        console.error("Gagal mencatat log:", error);
    }
};

exports.getKasus = async (req, res) => {
    try {
        const query = `
            SELECT k.id, k.penyakit_id, k.wilayah_id, k.periode, k.jumlah, k.status, k.catatan, k.catatan_validator, k.created_at,
                   p.nama AS penyakit, w.nama AS wilayah, u.nama AS admin
            FROM kasus k
            JOIN penyakit p ON k.penyakit_id = p.id
            JOIN wilayah w ON k.wilayah_id = w.id
            JOIN users u ON k.user_id = u.id
            ORDER BY k.id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Gagal mengambil data." }); }
};

exports.createKasus = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Belum login." });
    const { penyakit_id, wilayah_id, periode, jumlah, status, catatan } = req.body;
    const user_id = req.session.user.id;

    if (!penyakit_id || !wilayah_id || !periode || !jumlah) return res.status(400).json({ message: "Data tidak lengkap." });

    try {
        const [existing] = await db.query("SELECT id FROM kasus WHERE penyakit_id = ? AND wilayah_id = ? AND periode = ?", [penyakit_id, wilayah_id, periode]);
        if (existing.length > 0) return res.status(400).json({ message: "Data sudah ada." });

        await db.query("INSERT INTO kasus (penyakit_id, wilayah_id, periode, jumlah, status, catatan, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)", [penyakit_id, wilayah_id, periode, jumlah, status || 'Draft', catatan || null, user_id]);

        // Catat Log
        const [p] = await db.query("SELECT nama FROM penyakit WHERE id = ?", [penyakit_id]);
        const [w] = await db.query("SELECT nama FROM wilayah WHERE id = ?", [wilayah_id]);
        await catatLog(user_id, status === 'Draft' ? 'Simpan Draft' : 'Ajukan Validasi', `Data ${p[0].nama} di ${w[0].nama} periode ${periode}`);

        res.status(201).json({ message: "Data kasus berhasil disimpan." });
    } catch (error) { res.status(500).json({ message: "Gagal menyimpan data." }); }
};

exports.updateKasus = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Belum login." });
    const { id } = req.params;
    const { penyakit_id, wilayah_id, periode, jumlah, status, catatan } = req.body;

    try {
        const [rows] = await db.query("SELECT status FROM kasus WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan." });
        if (rows[0].status !== 'Draft' && rows[0].status !== 'Dikembalikan') return res.status(403).json({ message: "Data terkunci." });

        await db.query("UPDATE kasus SET penyakit_id = ?, wilayah_id = ?, periode = ?, jumlah = ?, status = ?, catatan = ? WHERE id = ?", [penyakit_id, wilayah_id, periode, jumlah, status, catatan, id]);

        // Catat Log
        const [p] = await db.query("SELECT nama FROM penyakit WHERE id = ?", [penyakit_id]);
        const [w] = await db.query("SELECT nama FROM wilayah WHERE id = ?", [wilayah_id]);
        await catatLog(req.session.user.id, status === 'Draft' ? 'Edit Draft' : 'Ajukan Ulang Validasi', `Data ${p[0].nama} di ${w[0].nama} periode ${periode}`);

        res.json({ message: "Data kasus berhasil diperbarui." });
    } catch (error) { res.status(500).json({ message: "Gagal memperbarui data." }); }
};

exports.deleteKasus = async (req, res) => {
    if (!req.session.user) return res.status(401).json({ message: "Belum login." });
    const { id } = req.params;

    try {
        // Ambil info untuk log sebelum dihapus
        const [rows] = await db.query("SELECT k.*, p.nama AS penyakit, w.nama AS wilayah FROM kasus k JOIN penyakit p ON k.penyakit_id = p.id JOIN wilayah w ON k.wilayah_id = w.id WHERE k.id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan." });
        if (rows[0].status !== 'Draft') return res.status(403).json({ message: "Hanya data Draft yang bisa dihapus." });

        await db.query("DELETE FROM kasus WHERE id = ?", [id]);

        // Catat Log
        await catatLog(req.session.user.id, 'Hapus Data', `Menghapus data ${rows[0].penyakit} di ${rows[0].wilayah}`);

        res.json({ message: "Data kasus berhasil dihapus." });
    } catch (error) { res.status(500).json({ message: "Gagal menghapus data." }); }
};

exports.getKasusMenunggu = async (req, res) => {
    try {
        const query = `
            SELECT k.id, k.periode, k.jumlah, k.status, k.catatan, k.catatan_validator, k.created_at,
                   p.nama AS penyakit, w.nama AS wilayah, u.nama AS admin
            FROM kasus k
            JOIN penyakit p ON k.penyakit_id = p.id
            JOIN wilayah w ON k.wilayah_id = w.id
            JOIN users u ON k.user_id = u.id
            WHERE k.status = 'Menunggu validasi'
            ORDER BY k.id ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) { res.status(500).json({ message: "Gagal mengambil data." }); }
};

exports.prosesValidasi = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'validator') return res.status(403).json({ message: "Akses ditolak." });
    const { id } = req.params;
    const { status, catatan } = req.body; // Dipublikasikan / Dikembalikan

    try {
        const [rows] = await db.query("SELECT k.*, p.nama AS penyakit, w.nama AS wilayah FROM kasus k JOIN penyakit p ON k.penyakit_id = p.id JOIN wilayah w ON k.wilayah_id = w.id WHERE k.id = ?", [id]);
        
        await db.query("UPDATE kasus SET status = ?, catatan_validator = ? WHERE id = ?", [status, catatan || null, id]);

        // Catat Log
        const aksi = status === 'Dipublikasikan' ? 'Menyetujui Data' : 'Mengembalikan Data';
        await catatLog(req.session.user.id, aksi, `Data ${rows[0].penyakit} di ${rows[0].wilayah} periode ${rows[0].periode}`);

        res.json({ message: `Data berhasil ${status === 'Dipublikasikan' ? 'disetujui' : 'dikembalikan'}.` });
    } catch (error) { res.status(500).json({ message: "Gagal memproses validasi." }); }
};