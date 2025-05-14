// backend/controllers/authController.js
const authService = require('../services/authService');
const mailService = require('../services/mailService');
const User = require('../models/User');
const crypto = require('crypto');
const { createError } = require('../utils/errorHandler');

/**
 * Controlador de autenticación
 * Sigue el patrón controlador ligero - servicio pesado
 */
class AuthController {
  /**
   * Registra un nuevo usuario
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async register(req, res, next) {
    try {
      const userData = req.body;
      
      // Registrar usuario mediante el servicio
      const { user, token } = await authService.register(userData);
      
      // Enviar correo de bienvenida (asíncrono, no esperamos respuesta)
      mailService.sendWelcomeEmail(user);
      
      res.status(201).json({
        success: true,
        message: 'Usuario registrado exitosamente',
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Inicia sesión de un usuario
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async login(req, res, next) {
    try {
      const { email, password } = req.body;
      
      // Iniciar sesión mediante el servicio
      const { user, token } = await authService.login(email, password);
      
      res.status(200).json({
        success: true,
        message: 'Inicio de sesión exitoso',
        data: { user, token }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene el perfil del usuario autenticado
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async getProfile(req, res, next) {
    try {
      // El usuario ya está en req.user gracias al middleware de autenticación
      res.status(200).json({
        success: true,
        data: req.user
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza la contraseña del usuario
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async changePassword(req, res, next) {
    try {
      const { currentPassword, newPassword } = req.body;
      const userId = req.user._id;
      
      // Cambiar contraseña mediante el servicio
      await authService.changePassword(userId, currentPassword, newPassword);
      
      res.status(200).json({
        success: true,
        message: 'Contraseña actualizada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Solicita restablecer contraseña olvidada
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async forgotPassword(req, res, next) {
    try {
      const { email } = req.body;
      
      if (!email) {
        return next(createError(400, 'Por favor proporcione su correo electrónico'));
      }
      
      // Buscar usuario por email
      const user = await User.findOne({ email });
      
      if (!user) {
        // Por seguridad, no revelamos si el email existe o no
        return res.status(200).json({
          success: true,
          message: 'Si el correo electrónico está registrado, recibirá instrucciones para restablecer su contraseña'
        });
      }
      
      // Generar token de restablecimiento (válido por 1 hora)
      const resetToken = crypto.randomBytes(32).toString('hex');
      user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hora
      
      await user.save();
      
      // Enviar correo con el token
      await mailService.sendPasswordResetEmail(user, resetToken);
      
      res.status(200).json({
        success: true,
        message: 'Si el correo electrónico está registrado, recibirá instrucciones para restablecer su contraseña'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Restablece la contraseña con un token válido
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async resetPassword(req, res, next) {
    try {
      const { token, newPassword } = req.body;
      
      if (!token || !newPassword) {
        return next(createError(400, 'Por favor proporcione el token y la nueva contraseña'));
      }
      
      // Hash el token para compararlo con el almacenado
      const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
      
      // Buscar usuario con token válido y no expirado
      const user = await User.findOne({
        resetPasswordToken,
        resetPasswordExpires: { $gt: Date.now() }
      });
      
      if (!user) {
        return next(createError(400, 'Token inválido o expirado'));
      }
      
      // Validar nueva contraseña
      if (!authService.validatePassword(newPassword)) {
        return next(createError(400, 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número'));
      }
      
      // Actualizar contraseña y limpiar token
      user.password = newPassword;
      user.resetPasswordToken = undefined;
      user.resetPasswordExpires = undefined;
      
      await user.save();
      
      res.status(200).json({
        success: true,
        message: 'Contraseña restablecida exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza el perfil del usuario
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async updateProfile(req, res, next) {
    try {
      const userId = req.user._id;
      const { username, email } = req.body;
      
      // Verificar datos únicos
      if (username) {
        const existingUsername = await User.findOne({ username, _id: { $ne: userId } });
        if (existingUsername) {
          return next(createError(400, 'Este nombre de usuario ya está en uso'));
        }
      }
      
      if (email) {
        const existingEmail = await User.findOne({ email, _id: { $ne: userId } });
        if (existingEmail) {
          return next(createError(400, 'Este correo electrónico ya está registrado'));
        }
      }
      
      // Actualizar perfil
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { username, email } },
        { new: true, runValidators: true }
      ).select('-password');
      
      if (!user) {
        return next(createError(404, 'Usuario no encontrado'));
      }
      
      res.status(200).json({
        success: true,
        message: 'Perfil actualizado exitosamente',
        data: user
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza la foto de perfil del usuario
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async updateProfilePicture(req, res, next) {
    try {
      // El archivo está disponible gracias al middleware multer
      if (!req.file) {
        return next(createError(400, 'No se proporcionó ninguna imagen'));
      }
      
      const userId = req.user._id;
      const profilePicture = req.file.path.replace(/\\/g, '/'); // Normalizar ruta
      
      // Actualizar foto de perfil
      const user = await User.findByIdAndUpdate(
        userId,
        { $set: { profilePicture } },
        { new: true }
      ).select('-password');
      
      if (!user) {
        return next(createError(404, 'Usuario no encontrado'));
      }
      
      res.status(200).json({
        success: true,
        message: 'Foto de perfil actualizada exitosamente',
        data: {
          profilePicture: user.profilePicture
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AuthController();