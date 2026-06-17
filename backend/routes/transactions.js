'use strict';
const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { protect } = require('../middleware/auth');
router.post('/trade', protect, transactionController.executeTrade);
router.get('/', protect, transactionController.getTransactions);
router.get('/:id', protect, transactionController.getTransaction);
module.exports = router;