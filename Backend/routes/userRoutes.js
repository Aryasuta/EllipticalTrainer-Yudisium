const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.post('/', userController.createUser);
router.get('/:cardId', userController.getUserByCardId);
router.put('/:cardId', userController.updateWeight);


module.exports = router;
