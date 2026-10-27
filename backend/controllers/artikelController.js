const db = require('../config/db');

exports.getArtikel = async (req, res) => {
    try {
        const query = `
            SELECT a.id, a.penyakit_id, p.nama AS nama_penyakit, 
                   a.gambar_url, a.deskripsi, a.gejala, a.pencegahan, a.link_video
            FROM artikel_penyakit a
            JOIN penyakit p ON a.penyakit_id = p.id
            ORDER BY p.nama ASC
        `;
        const [rows] = await db.query(query);
        res.json(rows);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal mengambil data artikel." });
    }
};

exports.saveArtikel = async (req, res) => {
    const { penyakit_id, gambar_url, deskripsi, gejala, pencegahan, link_video } = req.body;

    if (!penyakit_id || !deskripsi) {
        return res.status(400).json({ message: "Penyakit dan deskripsi wajib diisi." });
    }

    // Tentukan URL gambar: Prioritas file upload, jika tidak ada pakai URL input
    let finalGambarUrl = gambar_url || null;
    
    if (req.file) {
        // Path relatif untuk disimpan di database (agar mudah dipindah host)
        finalGambarUrl = `/uploads/${req.file.filename}`;
    }

    try {
        const [existing] = await db.query("SELECT id, gambar_url FROM artikel_penyakit WHERE penyakit_id = ?", [penyakit_id]);

        if (existing.length > 0) {
            // Jika sebelumnya sudah ada gambar (file upload) dan Admin tidak upload baru, 
            // dan Admin juga mengosongkan URL, maka gunakan gambar lama.
            if (!finalGambarUrl) {
                finalGambarUrl = existing[0].gambar_url;
            }

            await db.query(
                "UPDATE artikel_penyakit SET gambar_url = ?, deskripsi = ?, gejala = ?, pencegahan = ?, link_video = ? WHERE penyakit_id = ?",
                [finalGambarUrl, deskripsi, gejala || null, pencegahan || null, link_video || null, penyakit_id]
            );
        } else {
            await db.query(
                "INSERT INTO artikel_penyakit (penyakit_id, gambar_url, deskripsi, gejala, pencegahan, link_video) VALUES (?, ?, ?, ?, ?, ?)",
                [penyakit_id, finalGambarUrl, deskripsi, gejala || null, pencegahan || null, link_video || null]
            );
        }

        res.json({ message: "Artikel penyakit berhasil disimpan." });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Gagal menyimpan artikel." });
    }
};