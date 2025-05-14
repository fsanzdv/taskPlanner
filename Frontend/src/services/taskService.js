// frontend/src/services/taskService.js
import api from './api';

/**
 * Servicio de tareas para el frontend
 */
const taskService = {
  /**
   * Obtiene todas las tareas del usuario
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Promise} - Promesa con la respuesta
   */
  getTasks: async (filters = {}) => {
    // Convertir filtros a parámetros de consulta
    const params = new URLSearchParams();
    
    if (filters.status) params.append('status', filters.status);
    if (filters.search) params.append('search', filters.search);
    if (filters.fromDate) params.append('fromDate', filters.fromDate);
    if (filters.toDate) params.append('toDate', filters.toDate);
    if (filters.page) params.append('page', filters.page);
    if (filters.limit) params.append('limit', filters.limit);
    if (filters.sort) params.append('sort', filters.sort);
    
    const response = await api.get(`/tasks?${params.toString()}`);
    return response.data;
  },
  
  /**
   * Obtiene una tarea por su ID
   * @param {String} taskId - ID de la tarea
   * @returns {Promise} - Promesa con la respuesta
   */
  getTaskById: async (taskId) => {
    const response = await api.get(`/tasks/${taskId}`);
    return response.data;
  },
  
  /**
   * Crea una nueva tarea
   * @param {Object} taskData - Datos de la tarea
   * @returns {Promise} - Promesa con la respuesta
   */
  createTask: async (taskData) => {
    const response = await api.post('/tasks', taskData);
    return response.data;
  },
  
  /**
   * Actualiza una tarea
   * @param {String} taskId - ID de la tarea
   * @param {Object} taskData - Datos a actualizar
   * @returns {Promise} - Promesa con la respuesta
   */
  updateTask: async (taskId, taskData) => {
    const response = await api.put(`/tasks/${taskId}`, taskData);
    return response.data;
  },
  
  /**
   * Elimina una tarea
   * @param {String} taskId - ID de la tarea
   * @returns {Promise} - Promesa con la respuesta
   */
  deleteTask: async (taskId) => {
    const response = await api.delete(`/tasks/${taskId}`);
    return response.data;
  },
  
  /**
   * Añade un archivo adjunto a una tarea
   * @param {String} taskId - ID de la tarea
   * @param {File} file - Archivo adjunto
   * @returns {Promise} - Promesa con la respuesta
   */
  addAttachment: async (taskId, file) => {
    const formData = new FormData();
    formData.append('taskAttachment', file);
    
    const response = await api.post(`/tasks/${taskId}/attachments`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    
    return response.data;
  },
  
  /**
   * Elimina un archivo adjunto de una tarea
   * @param {String} taskId - ID de la tarea
   * @param {String} attachmentId - ID del archivo adjunto
   * @returns {Promise} - Promesa con la respuesta
   */
  removeAttachment: async (taskId, attachmentId) => {
    const response = await api.delete(`/tasks/${taskId}/attachments/${attachmentId}`);
    return response.data;
  }
};

export default taskService;