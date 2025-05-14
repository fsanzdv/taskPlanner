// backend/utils/validators.js
/**
 * Valida un correo electrónico
 * @param {String} email - Correo electrónico a validar
 * @returns {Boolean} - Resultado de la validación
 */
const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email);
  };
  
  /**
   * Valida una contraseña
   * @param {String} password - Contraseña a validar
   * @returns {Boolean} - Resultado de la validación
   */
  const validatePassword = (password) => {
    // Al menos 8 caracteres, una mayúscula, una minúscula y un número
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
    return passwordRegex.test(password);
  };
  
  /**
   * Valida una fecha
   * @param {String} date - Fecha a validar (formato YYYY-MM-DD)
   * @returns {Boolean} - Resultado de la validación
   */
  const validateDate = (date) => {
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) return false;
    
    const d = new Date(date);
    return d instanceof Date && !isNaN(d);
  };
  
  /**
   * Valida que un objeto tenga ciertos campos requeridos
   * @param {Object} object - Objeto a validar
   * @param {Array} requiredFields - Lista de campos requeridos
   * @returns {Object} - Resultado de la validación { isValid, missingFields }
   */
  const validateRequiredFields = (object, requiredFields) => {
    const missingFields = [];
    
    for (const field of requiredFields) {
      if (!object[field] || (typeof object[field] === 'string' && object[field].trim() === '')) {
        missingFields.push(field);
      }
    }
    
    return {
      isValid: missingFields.length === 0,
      missingFields
    };
  };
  
  /**
   * Sanea una cadena para prevenir XSS
   * @param {String} str - Cadena a sanear
   * @returns {String} - Cadena saneada
   */
  const sanitizeString = (str) => {
    if (!str) return '';
    return String(str)
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  };
  
  /**
   * Sanea un objeto completo para prevenir XSS
   * @param {Object} obj - Objeto a sanear
   * @returns {Object} - Objeto saneado
   */
  const sanitizeObject = (obj) => {
    if (!obj || typeof obj !== 'object' || obj instanceof Date) return obj;
    
    if (Array.isArray(obj)) {
      return obj.map(item => sanitizeObject(item));
    }
    
    const sanitized = {};
    for (const [key, value] of Object.entries(obj)) {
      if (typeof value === 'string') {
        sanitized[key] = sanitizeString(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    
    return sanitized;
  };
  
  module.exports = {
    validateEmail,
    validatePassword,
    validateDate,
    validateRequiredFields,
    sanitizeString,
    sanitizeObject
  };