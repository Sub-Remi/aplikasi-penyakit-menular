const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const artikelController = require('../controllers/artikelController');

// Konfigurasi penyimpanan file
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/'); // Simpan di folder uploads
    },
    filename: function (req, file, cb) {
        // Beri nama unik: tanggal-waktu-namaasli
        cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    }
});

// Filter hanya menerima file gambar
const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error('Hanya file gambar yang diperbolehkan!'), false);
    }
};

const upload = multer({ storage: storage, fileFilter: fileFilter });

// Endpoint GET (Ambil Artikel)
router.get('/', artikelController.getArtikel);

// Endpoint POST (Simpan Artikel + Upload File)
// upload.single('gambar_file') menangkap file dengan key 'gambar_file'
router.post('/', upload.single('gambar_file'), artikelController.saveArtikel);

module.exports = router;