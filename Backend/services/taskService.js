// backend/services/taskService.js
const Task = require('../models/Task');
const { createError } = require('../utils/errorHandler');
const weatherService = require('./weatherService');

/**
 * Servicio de tareas - Implementa lógica relacionada con las tareas
 * Siguiendo principio de responsabilidad única (S de SOLID)
 */
class TaskService {
  /**
   * Crea una nueva tarea
   * @param {Object} taskData - Datos de la tarea
   * @param {String} userId - ID del usuario
   * @returns {Object} - Tarea creada
   */
  async createTask(taskData, userId) {
    const { title, description, dueDate, status, city } = taskData;
    
    // Validar datos
    if (!title || !description || !dueDate || !city) {
      throw createError(400, 'Por favor proporcione todos los campos requeridos');
    }
    
    // Crear nueva tarea
    const task = new Task({
      title,
      description,
      dueDate,
      status: status || 'pendiente',
      city,
      userId
    });
    
    // Obtener datos del clima para la ciudad y fecha
    try {
      const weatherData = await weatherService.getForecast(city, dueDate);
      task.weatherData = weatherData;
    } catch (error) {
      // No falla la creación de la tarea si no se pueden obtener datos del clima
      console.error('Error al obtener datos del clima:', error);
    }
    
    // Guardar tarea
    await task.save();
    
    return task;
  }
  
  /**
   * Obtiene todas las tareas de un usuario
   * @param {String} userId - ID del usuario
   * @param {Object} filters - Filtros para la búsqueda
   * @returns {Array} - Lista de tareas
   */
  async getTasks(userId, filters = {}) {
    const query = { userId };
    
    // Aplicar filtros si existen
    if (filters.status) {
      query.status = filters.status;
    }
    
    if (filters.fromDate) {
      query.dueDate = { $gte: new Date(filters.fromDate) };
    }
    
    if (filters.toDate) {
      if (query.dueDate) {
        query.dueDate.$lte = new Date(filters.toDate);
      } else {
        query.dueDate = { $lte: new Date(filters.toDate) };
      }
    }
    
    if (filters.search) {
      const searchRegex = new RegExp(filters.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { city: searchRegex }
      ];
    }
    
    // Ordenar por fecha de vencimiento ascendente por defecto
    const sort = filters.sort || { dueDate: 1 };
    
    // Paginación
    const page = parseInt(filters.page) || 1;
    const limit = parseInt(filters.limit) || 10;
    const skip = (page - 1) * limit;
    
    // Ejecutar consulta
    const tasks = await Task.find(query)
      .sort(sort)
      .skip(skip)
      .limit(limit);
    
    // Obtener total de tareas para paginación
    const total = await Task.countDocuments(query);
    
    return {
      tasks,
      pagination: {
        total,
        page,
        limit,
        pages: Math.ceil(total / limit)
      }
    };
  }
  
  /**
   * Obtiene una tarea por su ID
   * @param {String} taskId - ID de la tarea
   * @param {String} userId - ID del usuario (para verificar propiedad)
   * @returns {Object} - Tarea encontrada
   */
  async getTaskById(taskId, userId) {
    const task = await Task.findById(taskId);
    
    if (!task) {
      throw createError(404, 'Tarea no encontrada');
    }
    
    // Verificar que la tarea pertenece al usuario
    if (task.userId.toString() !== userId) {
      throw createError(403, 'No tienes permiso para acceder a esta tarea');
    }
    
    return task;
  }
  
  /**
   * Actualiza una tarea
   * @param {String} taskId - ID de la tarea
   * @param {Object} taskData - Datos a actualizar
   * @param {String} userId - ID del usuario
   * @returns {Object} - Tarea actualizada
   */
  async updateTask(taskId, taskData, userId) {
    // Verificar que la tarea existe y pertenece al usuario
    const task = await this.getTaskById(taskId, userId);
    
    const { title, description, dueDate, status, city } = taskData;
    
    // Actualizar campos
    if (title) task.title = title;
    if (description) task.description = description;
    if (status) task.status = status;
    
    // Si cambia la ciudad o la fecha, actualizar datos del clima
    if ((city && city !== task.city) || (dueDate && dueDate !== task.dueDate)) {
      task.city = city || task.city;
      task.dueDate = dueDate || task.dueDate;
      
      // Obtener nuevos datos del clima
      try {
        const weatherData = await weatherService.getForecast(task.city, task.dueDate);
        task.weatherData = weatherData;
      } catch (error) {
        console.error('Error al actualizar datos del clima:', error);
      }
    }
    
    task.updatedAt = Date.now();
    await task.save();
    
    return task;
  }
  
  /**
   * Elimina una tarea
   * @param {String} taskId - ID de la tarea
   * @param {String} userId - ID del usuario
   * @returns {Boolean} - Resultado de la operación
   */
  async deleteTask(taskId, userId) {
    // Verificar que la tarea existe y pertenece al usuario
    const task = await this.getTaskById(taskId, userId);
    
    await Task.findByIdAndDelete(taskId);
    
    return true;
  }
  
  /**
   * Añade un archivo adjunto a una tarea
   * @param {String} taskId - ID de la tarea
   * @param {Object} fileData - Datos del archivo
   * @param {String} userId - ID del usuario
   * @returns {Object} - Tarea actualizada
   */
  async addAttachment(taskId, fileData, userId) {
    // Verificar que la tarea existe y pertenece al usuario
    const task = await this.getTaskById(taskId, userId);
    
    task.attachments.push({
      filename: fileData.originalname,
      path: fileData.path
    });
    
    task.updatedAt = Date.now();
    await task.save();
    
    return task;
  }
  
  /**
   * Elimina un archivo adjunto de una tarea
   * @param {String} taskId - ID de la tarea
   * @param {String} attachmentId - ID del archivo adjunto
   * @param {String} userId - ID del usuario
   * @returns {Object} - Tarea actualizada
   */
  async removeAttachment(taskId, attachmentId, userId) {
    // Verificar que la tarea existe y pertenece al usuario
    const task = await this.getTaskById(taskId, userId);
    
    // Buscar el índice del archivo adjunto
    const attachmentIndex = task.attachments.findIndex(
      att => att._id.toString() === attachmentId
    );
    
    if (attachmentIndex === -1) {
      throw createError(404, 'Archivo adjunto no encontrado');
    }
    
    // Eliminar el archivo adjunto
    task.attachments.splice(attachmentIndex, 1);
    
    task.updatedAt = Date.now();
    await task.save();
    
    return task;
  }
}

module.exports = new TaskService();