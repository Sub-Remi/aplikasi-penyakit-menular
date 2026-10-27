const express = require('express');
const router = express.Router();
const publikController = require('../controllers/publikController');

router.get('/kasus', publikController.getKasusPublik);

module.exports = router;