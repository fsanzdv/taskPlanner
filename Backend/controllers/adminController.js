// backend/controllers/adminController.js
const User = require('../models/User');
const Task = require('../models/Task');
const Event = require('../models/Event');
const { createError } = require('../utils/errorHandler');

/**
 * Controlador para el panel de administración
 * Solo accesible para usuarios con rol de administrador
 */
class AdminController {
  /**
   * Obtiene estadísticas generales del sistema
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async getStatistics(req, res, next) {
    try {
      // Contar usuarios, tareas y eventos
      const totalUsers = await User.countDocuments();
      const totalTasks = await Task.countDocuments();
      const totalEvents = await Event.countDocuments();
      
      // Contar tareas por estado
      const tasksByStatus = await Task.aggregate([
        {
          $group: {
            _id: '$status',
            count: { $sum: 1 }
          }
        }
      ]);
      
      // Contar usuarios registrados por día (últimos 30 días)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const usersByDay = await User.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            '_id.day': 1
          }
        }
      ]);
      
      // Formatear fechas para la respuesta
      const userGrowth = usersByDay.map(day => ({
        date: `${day._id.year}-${day._id.month.toString().padStart(2, '0')}-${day._id.day.toString().padStart(2, '0')}`,
        count: day.count
      }));
      
      // Contar tareas creadas por día (últimos 30 días)
      const tasksByDay = await Task.aggregate([
        {
          $match: {
            createdAt: { $gte: thirtyDaysAgo }
          }
        },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' },
              day: { $dayOfMonth: '$createdAt' }
            },
            count: { $sum: 1 }
          }
        },
        {
          $sort: {
            '_id.year': 1,
            '_id.month': 1,
            '_id.day': 1
          }
        }
      ]);
      
      // Formatear fechas para la respuesta
      const taskGrowth = tasksByDay.map(day => ({
        date: `${day._id.year}-${day._id.month.toString().padStart(2, '0')}-${day._id.day.toString().padStart(2, '0')}`,
        count: day.count
      }));
      
      res.status(200).json({
        success: true,
        data: {
          totals: {
            users: totalUsers,
            tasks: totalTasks,
            events: totalEvents
          },
          tasksByStatus: tasksByStatus,
          userGrowth: userGrowth,
          taskGrowth: taskGrowth
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene la lista de usuarios
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async getUsers(req, res, next) {
    try {
      const { search, page = 1, limit = 10, sort = 'createdAt:desc' } = req.query;
      
      // Construir consulta
      const query = {};
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        query.$or = [
          { username: searchRegex },
          { email: searchRegex }
        ];
      }
      
      // Opciones de paginación
      const options = {
        page: parseInt(page),
        limit: parseInt(limit),
        select: '-password',
        sort: {}
      };
      
      // Opciones de ordenamiento
      if (sort) {
        const [field, order] = sort.split(':');
        options.sort[field] = order === 'desc' ? -1 : 1;
      }
      
      // Ejecutar consulta paginada
      const users = await User.find(query)
        .select(options.select)
        .sort(options.sort)
        .skip((options.page - 1) * options.limit)
        .limit(options.limit);
      
      // Contar total de usuarios para paginación
      const total = await User.countDocuments(query);
      
      res.status(200).json({
        success: true,
        data: users,
        pagination: {
          total,
          page: options.page,
          limit: options.limit,
          pages: Math.ceil(total / options.limit)
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Cambia el rol de un usuario
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async changeUserRole(req, res, next) {
    try {
      const { userId } = req.params;
      const { role } = req.body;
      
      // Validar rol
      if (!role || !['user', 'admin'].includes(role)) {
        return next(createError(400, 'Rol inválido. Debe ser "user" o "admin"'));
      }
      
      // Verificar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return next(createError(404, 'Usuario no encontrado'));
      }
      
      // Actualizar rol
      user.role = role;
      await user.save();
      
      // Notificar mediante WebSockets si está disponible
      if (req.app.io) {
        req.app.io.notifyUser(userId, {
          type: 'role_updated',
          message: `Tu rol ha sido actualizado a: ${role}`
        });
      }
      
      res.status(200).json({
        success: true,
        message: `Rol actualizado a "${role}" exitosamente`,
        data: {
          userId: user._id,
          username: user.username,
          role: user.role
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Desactiva o reactiva una cuenta de usuario
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async toggleUserStatus(req, res, next) {
    try {
      const { userId } = req.params;
      const { active } = req.body;
      
      // Validar estado
      if (active === undefined) {
        return next(createError(400, 'El estado "active" es requerido'));
      }
      
      // Verificar que el usuario existe
      const user = await User.findById(userId);
      if (!user) {
        return next(createError(404, 'Usuario no encontrado'));
      }
      
      // Actualizar estado
      user.isActive = Boolean(active);
      await user.save();
      
      // Notificar mediante WebSockets si está disponible
      if (req.app.io) {
        req.app.io.notifyUser(userId, {
          type: 'account_status',
          message: user.isActive 
            ? 'Tu cuenta ha sido reactivada' 
            : 'Tu cuenta ha sido desactivada'
        });
      }
      
      res.status(200).json({
        success: true,
        message: user.isActive 
          ? 'Cuenta activada exitosamente' 
          : 'Cuenta desactivada exitosamente',
        data: {
          userId: user._id,
          username: user.username,
          isActive: user.isActive
        }
      });
    } catch (error) {
      next(error);
    }
  }
  
  /**
   * Obtiene información detallada de un usuario específico
   * @param {Object} req - Objeto de solicitud
   * @param {Object} res - Objeto de respuesta
   * @param {Function} next - Función next
   */
  async getUserDetails(req, res, next) {
    try {
      const { userId } = req.params;
      
      // Verificar que el usuario existe
      const user = await User.findById(userId).select('-password');
      if (!user) {
        return next(createError(404, 'Usuario no encontrado'));
      }
      
      // Contar tareas y eventos del usuario
      const taskCount = await Task.countDocuments({ userId });
      const eventCount = await Event.countDocuments({ userId });
      
      // Obtener tareas recientes
      const recentTasks = await Task.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);
      
      // Obtener eventos recientes
      const recentEvents = await Event.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5);
      
      res.status(200).json({
        success: true,
        data: {
          user,
          stats: {
            taskCount,
            eventCount
          },
          recentTasks,
          recentEvents
        }
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new AdminController();