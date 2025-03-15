const express = require('express');
const userController = require('../controllers/userController');
const { isAdmin } = require('../middlewares/authMiddleware');
const router = express.Router();

router.get('/users', isAdmin, userController.renderAddUserPage);
router.post('/add-user', isAdmin, userController.addUser);
router.get('/admin/get-users', isAdmin, userController.getUsers);
router.get('/admin/get-user/:id', isAdmin, userController.getUserById);
router.post('/delete-user/:id', isAdmin, userController.deleteUser);
router.post('/edit-user/:id', isAdmin, userController.updateUser);


module.exports = router;