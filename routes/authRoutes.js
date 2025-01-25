const express = require('express');
const authController = require('../controllers/authController');
const { isAuthenticated } = require('../middlewares/authMiddleware');
const router = express.Router();

router.post('/login', authController.login);
router.get('/logout', authController.logout);
router.post('/user/change-password', isAuthenticated, authController.changePassword);


module.exports = router;