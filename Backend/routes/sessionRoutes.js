const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.post('/start', sessionController.startSession);
router.post('/end', sessionController.endSession);
router.post('/check-user', sessionController.checkUserExistence);
router.get('/active-latest', sessionController.getLatestActiveSession);
router.get('/:cardId', sessionController.getSessionHistory);
router.get('/latest/:cardId', sessionController.getLatestSession); 

module.exports = router;
