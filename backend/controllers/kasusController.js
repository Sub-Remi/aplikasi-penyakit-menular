const db = require('../config/db');

// 1. Ambil semua data kasus (dengan JOIN untuk mendapatkan nama penyakit & wilayah)
exports.getKasus = async (req, res) => {
    try {
        const query = `
            SELECT 
                k.id, 
                k.penyakit_id, 
                k.wilayah_id, 
                k.periode, 
                k.jumlah, 
                k.status, 
                k.catatan,
                k.catatan_validator, 
                k.created_at,
                p.nama AS penyakit, 
                w.nama AS wilayah,
                u.nama AS admin
            FROM kasus k
            JOIN penyakit p ON k.penyakit_id = p.id
            JOIN wilayah w ON k.wilayah_id = w.id
            JOIN users u ON k.user_id = u.id
            ORDER BY k.id DESC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data kasus." });
    }
};

// 2. Tambah data kasus (Draft / Ajukan Validasi)
exports.createKasus = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Anda belum login. Silakan login terlebih dahulu." });
    }

    const { penyakit_id, wilayah_id, periode, jumlah, status, catatan } = req.body;
    const user_id = req.session.user.id; 

    if (!penyakit_id || !wilayah_id || !periode || !jumlah) {
        return res.status(400).json({ message: "Penyakit, wilayah, periode, dan jumlah wajib diisi." });
    }

    try {
        const [existing] = await db.query(
            "SELECT id FROM kasus WHERE penyakit_id = ? AND wilayah_id = ? AND periode = ?",
            [penyakit_id, wilayah_id, periode]
        );

        if (existing.length > 0) {
            return res.status(400).json({ message: "Data kasus untuk penyakit, wilayah, dan periode ini sudah ada. Silakan edit data yang lama." });
        }

        await db.query(
            "INSERT INTO kasus (penyakit_id, wilayah_id, periode, jumlah, status, catatan, user_id) VALUES (?, ?, ?, ?, ?, ?, ?)",
            [penyakit_id, wilayah_id, periode, jumlah, status || 'Draft', catatan || null, user_id]
        );

        res.status(201).json({ message: "Data kasus berhasil disimpan." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal menyimpan data kasus." });
    }
};

// 3. Edit data kasus (Hanya bisa jika statusnya Draft atau Dikembalikan)
exports.updateKasus = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Anda belum login." });
    }

    const { id } = req.params;
    const { penyakit_id, wilayah_id, periode, jumlah, status, catatan } = req.body;

    try {
        const [rows] = await db.query("SELECT status FROM kasus WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan." });
        
        const currentStatus = rows[0].status;
        if (currentStatus !== 'Draft' && currentStatus !== 'Dikembalikan') {
            return res.status(403).json({ message: "Data yang sudah diajukan atau dipublikasikan tidak dapat diedit." });
        }

        const [existing] = await db.query(
            "SELECT id FROM kasus WHERE penyakit_id = ? AND wilayah_id = ? AND periode = ? AND id != ?",
            [penyakit_id, wilayah_id, periode, id]
        );
        if (existing.length > 0) {
            return res.status(400).json({ message: "Data kasus untuk kombinasi ini sudah ada." });
        }

        await db.query(
            "UPDATE kasus SET penyakit_id = ?, wilayah_id = ?, periode = ?, jumlah = ?, status = ?, catatan = ? WHERE id = ?",
            [penyakit_id, wilayah_id, periode, jumlah, status, catatan, id]
        );

        res.json({ message: "Data kasus berhasil diperbarui." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal memperbarui data kasus." });
    }
};

// 4. Hapus data kasus (Hanya jika statusnya Draft)
exports.deleteKasus = async (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ message: "Anda belum login." });
    }

    const { id } = req.params;

    try {
        const [rows] = await db.query("SELECT status FROM kasus WHERE id = ?", [id]);
        if (rows.length === 0) return res.status(404).json({ message: "Data tidak ditemukan." });

        if (rows[0].status !== 'Draft') {
            return res.status(403).json({ message: "Hanya data berstatus Draft yang dapat dihapus." });
        }

        await db.query("DELETE FROM kasus WHERE id = ?", [id]);
        res.json({ message: "Data kasus berhasil dihapus." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal menghapus data kasus." });
    }
};

// 5. Ambil data yang menunggu validasi (Khusus Validator)
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
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data validasi." });
    }
};

// 6. Proses Validasi (Setujui / Kembalikan)
exports.prosesValidasi = async (req, res) => {
    if (!req.session.user || req.session.user.role !== 'validator') {
        return res.status(403).json({ message: "Hanya Validator yang dapat memproses validasi." });
    }

    const { id } = req.params;
    const { status, catatan } = req.body;

    if (!status || !['Dipublikasikan', 'Dikembalikan'].includes(status)) {
        return res.status(400).json({ message: "Status validasi tidak valid." });
    }

    try {
        await db.query(
            "UPDATE kasus SET status = ?, catatan_validator = ? WHERE id = ?", 
            [status, catatan || null, id]
        );
        res.json({ message: `Data berhasil ${status === 'Dipublikasikan' ? 'disetujui' : 'dikembalikan'}.` });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal memproses validasi." });
    }
};