// backend/controllers/taskController.js
const taskService = require('../services/taskService');
const { createError } = require('../utils/errorHandler');

/**
 * Controlador de tareas
 * Sigue el patrón controlador ligero - servicio pesado
 */
class TaskController {
  /**
   * Crea una nueva tarea
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async createTask(req, res, next) {
    try {
      const taskData = req.body;
      const userId = req.user._id;
      
      // Crear tarea mediante el servicio
      const task = await taskService.createTask(taskData, userId);
      
      // Notificar mediante WebSockets si está disponible
      if (req.app.io) {
        req.app.io.taskCreated(userId.toString(), task);
      }
      
      res.status(201).json({
        success: true,
        message: 'Tarea creada exitosamente',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene todas las tareas del usuario
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async getTasks(req, res, next) {
    try {
      const userId = req.user._id;
      const filters = req.query;
      
      // Obtener tareas mediante el servicio
      const result = await taskService.getTasks(userId, filters);
      
      res.status(200).json({
        success: true,
        data: result.tasks,
        pagination: result.pagination
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene una tarea por su ID
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async getTaskById(req, res, next) {
    try {
      const taskId = req.params.id;
      const userId = req.user._id;
      
      // Obtener tarea mediante el servicio
      const task = await taskService.getTaskById(taskId, userId);
      
      res.status(200).json({
        success: true,
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Actualiza una tarea
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async updateTask(req, res, next) {
    try {
      const taskId = req.params.id;
      const taskData = req.body;
      const userId = req.user._id;
      
      // Actualizar tarea mediante el servicio
      const task = await taskService.updateTask(taskId, taskData, userId);
      
      // Notificar mediante WebSockets si está disponible
      if (req.app.io) {
        req.app.io.taskUpdated(taskId, task);
      }
      
      res.status(200).json({
        success: true,
        message: 'Tarea actualizada exitosamente',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Elimina una tarea
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async deleteTask(req, res, next) {
    try {
      const taskId = req.params.id;
      const userId = req.user._id;
      
      // Eliminar tarea mediante el servicio
      await taskService.deleteTask(taskId, userId);
      
      // Notificar mediante WebSockets si está disponible
      if (req.app.io) {
        req.app.io.taskDeleted(taskId, userId.toString());
      }
      
      res.status(200).json({
        success: true,
        message: 'Tarea eliminada exitosamente'
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Añade un archivo adjunto a una tarea
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async addAttachment(req, res, next) {
    try {
      // El archivo está disponible gracias al middleware multer
      if (!req.file) {
        return next(createError(400, 'No se proporcionó ningún archivo'));
      }
      
      const taskId = req.params.id;
      const userId = req.user._id;
      
      // Añadir adjunto mediante el servicio
      const task = await taskService.addAttachment(taskId, req.file, userId);
      
      // Notificar mediante WebSockets si está disponible
      if (req.app.io) {
        req.app.io.taskUpdated(taskId, task);
      }
      
      res.status(200).json({
        success: true,
        message: 'Archivo adjunto añadido exitosamente',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Elimina un archivo adjunto de una tarea
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async removeAttachment(req, res, next) {
    try {
      const taskId = req.params.taskId;
      const attachmentId = req.params.attachmentId;
      const userId = req.user._id;
      
      // Eliminar adjunto mediante el servicio
      const task = await taskService.removeAttachment(taskId, attachmentId, userId);
      
      // Notificar mediante WebSockets si está disponible
      if (req.app.io) {
        req.app.io.taskUpdated(taskId, task);
      }
      
      res.status(200).json({
        success: true,
        message: 'Archivo adjunto eliminado exitosamente',
        data: task
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new TaskController();