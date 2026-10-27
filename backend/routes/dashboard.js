const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');

router.get('/statistik', dashboardController.getStatistik);
router.get('/terbaru', dashboardController.getKasusTerbaru);

module.exports = router;