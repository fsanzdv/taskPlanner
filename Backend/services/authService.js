// backend/services/authService.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../utils/errorHandler');
const { validateEmail, validatePassword } = require('../utils/validators');

/**
 * Servicio de autenticación - Implementa lógica relacionada con la autenticación
 * Siguiendo principio de responsabilidad única (S de SOLID)
 */
class AuthService {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario a registrar
   * @returns {Object} - Usuario registrado y token JWT
   */
  async register(userData) {
    const { username, email, password } = userData;
    
    // Validar datos
    if (!username || !email || !password) {
      throw createError(400, 'Por favor proporcione todos los campos requeridos');
    }
    
    if (!validateEmail(email)) {
      throw createError(400, 'Por favor proporcione un email válido');
    }
    
    if (!validatePassword(password)) {
      throw createError(400, 'La contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número');
    }
    
    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ 
      $or: [{ email }, { username }] 
    });
    
    if (existingUser) {
      if (existingUser.email === email) {
        throw createError(400, 'Este email ya está registrado');
      }
      throw createError(400, 'Este nombre de usuario ya está en uso');
    }
    
    // Crear nuevo usuario
    const user = new User({
      username,
      email,
      password
    });
    
    await user.save();
    
    // Generar token JWT
    const token = this.generateToken(user._id);
    
    // Devolver usuario (sin contraseña) y token
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt
    };
    
    return { user: userResponse, token };
  }
  
  /**
   * Inicia sesión de un usuario
   * @param {String} email - Email del usuario
   * @param {String} password - Contraseña del usuario
   * @returns {Object} - Usuario y token JWT
   */
  async login(email, password) {
    // Validar datos
    if (!email || !password) {
      throw createError(400, 'Por favor proporcione email y contraseña');
    }
    
    // Buscar usuario por email
    const user = await User.findOne({ email });
    
    if (!user) {
      throw createError(401, 'Credenciales inválidas');
    }
    
    // Verificar contraseña
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
      throw createError(401, 'Credenciales inválidas');
    }
    
    // Actualizar fecha de último inicio de sesión
    user.lastLogin = new Date();
    await user.save();
    
    // Generar token JWT
    const token = this.generateToken(user._id);
    
    // Devolver usuario (sin contraseña) y token
    const userResponse = {
      _id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      profilePicture: user.profilePicture,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin
    };
    
    return { user: userResponse, token };
  }
  
  /**
   * Genera un token JWT
   * @param {String} userId - ID del usuario
   * @returns {String} - Token JWT
   */
  generateToken(userId) {
    return jwt.sign(
      { userId },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
  }
  
  /**
   * Verifica y decodifica un token JWT
   * @param {String} token - Token JWT
   * @returns {Object} - Objeto decodificado
   */
  verifyToken(token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      throw createError(401, 'Token inválido o expirado');
    }
  }
  
  /**
   * Cambia la contraseña de un usuario
   * @param {String} userId - ID del usuario
   * @param {String} currentPassword - Contraseña actual
   * @param {String} newPassword - Nueva contraseña
   * @returns {Boolean} - Resultado de la operación
   */
  async changePassword(userId, currentPassword, newPassword) {
    // Validar datos
    if (!currentPassword || !newPassword) {
      throw createError(400, 'Por favor proporcione la contraseña actual y la nueva');
    }
    
    if (!validatePassword(newPassword)) {
      throw createError(400, 'La nueva contraseña debe tener al menos 8 caracteres, incluyendo una mayúscula, una minúscula y un número');
    }
    
    // Buscar usuario
    const user = await User.findById(userId);
    
    if (!user) {
      throw createError(404, 'Usuario no encontrado');
    }
    
    // Verificar contraseña actual
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
      throw createError(401, 'Contraseña actual incorrecta');
    }
    
    // Actualizar contraseña
    user.password = newPassword;
    await user.save();
    
    return true;
  }
}

module.exports = new AuthService();