'use strict';
const express = require('express');
const router = express.Router();
const portfolioController = require('../controllers/portfolioController');
const { protect } = require('../middleware/auth');
router.get('/', protect, portfolioController.getPortfolio);
module.exports = router;