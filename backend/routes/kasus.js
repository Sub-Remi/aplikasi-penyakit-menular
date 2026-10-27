const express = require('express');
const router = express.Router();
const kasusController = require('../controllers/kasusController');

router.get('/', kasusController.getKasus);
router.post('/', kasusController.createKasus);
router.put('/:id', kasusController.updateKasus);
router.delete('/:id', kasusController.deleteKasus);
router.get('/menunggu', kasusController.getKasusMenunggu);
router.put('/validasi/:id', kasusController.prosesValidasi);

module.exports = router;