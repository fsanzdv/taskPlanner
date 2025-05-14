// backend/utils/errorHandler.js
const logger = require('./logger');

/**
 * Crea un objeto de error personalizado
 * @param {Number} statusCode - Código de estado HTTP
 * @param {String} message - Mensaje de error
 * @returns {Error} - Error personalizado
 */
const createError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Middleware para manejo centralizado de errores
 * @param {Error} err - Objeto de error
 * @param {Object} req - Objeto de solicitud
 * @param {Object} res - Objeto de respuesta
 * @param {Function} next - Función next
 */
const errorHandler = (err, req, res, next) => {
  // Extraer información del error
  const statusCode = err.statusCode || 500;
  const message = err.message || 'Error interno del servidor';
  
  // Registrar error
  if (statusCode >= 500) {
    logger.error(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    logger.error(err.stack);
  } else {
    logger.warn(`${statusCode} - ${message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
  }
  
  // Determinar si incluir detalles del error
  const isDevelopment = process.env.NODE_ENV === 'development';
  
  // Responder con JSON
  res.status(statusCode).json({
    success: false,
    message,
    ...(isDevelopment && { stack: err.stack })
  });
};

module.exports = {
  createError,
  errorHandler
};