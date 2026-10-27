const express = require('express');
const router = express.Router();
const masterController = require('../controllers/masterController');

// Route Penyakit
router.get('/penyakit', masterController.getPenyakit);
router.post('/penyakit', masterController.createPenyakit);
router.put('/penyakit/:id', masterController.updatePenyakit);
router.delete('/penyakit/:id', masterController.deletePenyakit);

// Route Wilayah
router.get('/wilayah', masterController.getWilayah);
router.post('/wilayah', masterController.createWilayah);
router.put('/wilayah/:id', masterController.updateWilayah);
router.delete('/wilayah/:id', masterController.deleteWilayah);

module.exports = router;