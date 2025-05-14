// frontend/src/services/authService.js
import api from './api';

/**
 * Servicio de autenticación para el frontend
 */
const authService = {
  /**
   * Registra un nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @returns {Promise} - Promesa con la respuesta
   */
  register: async (userData) => {
    const response = await api.post('/auth/register', userData);
    
    // Guardar token y datos de usuario en localStorage
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  },
  
  /**
   * Inicia sesión de un usuario
   * @param {String} email - Email del usuario
   * @param {String} password - Contraseña del usuario
   * @returns {Promise} - Promesa con la respuesta
   */
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    
    // Guardar token y datos de usuario en localStorage
    if (response.data.data.token) {
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.user));
    }
    
    return response.data;
  },
  
  /**
   * Cierra sesión del usuario
   */
  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },
  
  /**
   * Obtiene el usuario actual
   * @returns {Object|null} - Usuario actual o null
   */
  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  },
  
  /**
   * Verifica si el usuario está autenticado
   * @returns {Boolean} - Estado de autenticación
   */
  isAuthenticated: () => {
    return !!localStorage.getItem('token');
  },
  
  /**
   * Verifica si el usuario es administrador
   * @returns {Boolean} - Es administrador
   */
  isAdmin: () => {
    const user = authService.getCurrentUser();
    return user && user.role === 'admin';
  },
  
  /**
   * Solicita restablecer contraseña
   * @param {String} email - Email del usuario
   * @returns {Promise} - Promesa con la respuesta
   */
  forgotPassword: async (email) => {
    const response = await api.post('/auth/forgot-password', { email });
    return response.data;
  },
  
  /**
   * Restablece la contraseña
   * @param {String} token - Token de restablecimiento
   * @param {String} newPassword - Nueva contraseña
   * @returns {Promise} - Promesa con la respuesta
   */
  resetPassword: async (token, newPassword) => {
    const response = await api.post('/auth/reset-password', { token, newPassword });
    return response.data;
  },
  
  /**
   * Cambia la contraseña del usuario
   * @param {String} currentPassword - Contraseña actual
   * @param {String} newPassword - Nueva contraseña
   * @returns {Promise} - Promesa con la respuesta
   */
  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },
  
  /**
   * Actualiza el perfil del usuario
   * @param {Object} profileData - Datos del perfil
   * @returns {Promise} - Promesa con la respuesta
   */
  updateProfile: async (profileData) => {
    const response = await api.put('/auth/profile', profileData);
    
    // Actualizar datos de usuario en localStorage
    if (response.data.success) {
      const user = authService.getCurrentUser();
      const updatedUser = { ...user, ...response.data.data };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  },
  
  /**
   * Actualiza la foto de perfil
   * @param {File} file - Archivo de imagen
   * @returns {Promise} - Promesa con la respuesta
   */
  updateProfilePicture: async (file) => {
    const formData = new FormData();
    formData.append('profilePicture', file);
    
    const response = await api.post('/auth/profile-picture', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    // Actualizar datos de usuario en localStorage
    if (response.data.success) {
      const user = authService.getCurrentUser();
      const updatedUser = { 
        ...user, 
        profilePicture: response.data.data.profilePicture 
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
    
    return response.data;
  }
};

export default authService;