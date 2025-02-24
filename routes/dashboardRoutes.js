const express = require('express');
const dashboardController = require('../controllers/dashboardController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/dashboard', isAuthenticated, dashboardController.dashboard);
router.get('/server-time', isAuthenticated, dashboardController.serverTime);

module.exports = router;