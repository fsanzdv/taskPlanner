// backend/middlewares/auth.js
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { createError } = require('../utils/errorHandler');

/**
 * Middleware para verificar la autenticación mediante JWT
 */
const authenticate = async (req, res, next) => {
  try {
    // Obtener el token del encabezado de autorización
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next(createError(401, 'No se proporcionó token de acceso'));
    }
    
    // Extraer el token sin el prefijo 'Bearer '
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return next(createError(401, 'No se proporcionó token de acceso'));
    }
    
    // Verificar y decodificar el token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Buscar el usuario basado en el ID del token decodificado
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return next(createError(401, 'Token inválido - Usuario no encontrado'));
    }
    
    // Adjuntar el usuario al objeto de solicitud para uso posterior
    req.user = user;
    
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return next(createError(401, 'Token inválido'));
    }
    
    if (error.name === 'TokenExpiredError') {
      return next(createError(401, 'Token expirado'));
    }
    
    next(error);
  }
};

/**
 * Middleware para verificar si el usuario tiene rol de administrador
 */
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(createError(403, 'Acceso denegado - Se requiere privilegios de administrador'));
  }
  
  next();
};

module.exports = {
  authenticate,
  isAdmin
};