// backend/routes/auth.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticate } = require('../config/middlewares/auth');
const { handleProfilePictureUpload } = require('../config/middlewares/upload');

// Rutas públicas
router.post('/register', authController.register);
router.post('/login', authController.login);
router.post('/forgot-password', authController.forgotPassword);
router.post('/reset-password', authController.resetPassword);

// Rutas protegidas (requieren autenticación)
router.get('/profile', authenticate, authController.getProfile);
router.put('/profile', authenticate, authController.updateProfile);
router.post('/change-password', authenticate, authController.changePassword);
router.post('/profile-picture', authenticate, handleProfilePictureUpload, authController.updateProfilePicture);

module.exports = router;