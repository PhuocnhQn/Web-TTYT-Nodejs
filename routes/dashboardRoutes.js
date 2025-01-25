const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/dashboard', isAuthenticated, dashboardController.dashboard);

module.exports = router;