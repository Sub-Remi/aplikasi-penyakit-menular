const express = require('express');
const router = express.Router();
const publikController = require('../controllers/publikController');

// Endpoint untuk Masyarakat (Tanpa Login)
router.get('/kasus', publikController.getKasusPublik);
router.get('/statistik', publikController.getStatistikPublik);

module.exports = router;