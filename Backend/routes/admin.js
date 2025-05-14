// backend/routes/admin.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate, isAdmin } = require('../middlewares/auth');

// Todas las rutas requieren autenticación y rol de administrador
router.use(authenticate, isAdmin);

// Rutas de administración
router.get('/statistics', adminController.getStatistics);
router.get('/users', adminController.getUsers);
router.get('/users/:userId', adminController.getUserDetails);
router.patch('/users/:userId/role', adminController.changeUserRole);
router.patch('/users/:userId/status', adminController.toggleUserStatus);

module.exports = router;