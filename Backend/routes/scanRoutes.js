const express = require('express');
const { saveScannedCard, getLatestScannedCard } = require('../controllers/scanController');

const router = express.Router();

router.post('/card', saveScannedCard);
router.get('/card', getLatestScannedCard);

module.exports = router; // ✅ MUST be here
