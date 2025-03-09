const express = require('express');
const router = express.Router();
const qrController = require('../controllers/qrController');

router.get('/qr', qrController.renderQrPage);
router.post('/generate', qrController.generateQrCode);

module.exports = router;