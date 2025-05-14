// backend/config/websocket.js
const socketIO = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Configura el servidor de WebSockets con Socket.IO
 * @param {Object} server - Servidor HTTP de Express
 * @returns {Object} - Instancia de Socket.IO
 */
const setupWebSockets = (server) => {
  // Opciones de Socket.IO
  const options = {
    cors: {
      origin: process.env.FRONTEND_URL || '*',
      methods: ['GET', 'POST'],
      credentials: true
    }
  };
  
  // Crear instancia de Socket.IO
  const io = socketIO(server, options);
  
  // Middleware para autenticación de WebSockets
  io.use(async (socket, next) => {
    try {
      // Obtener token de los parámetros de consulta
      const token = socket.handshake.auth.token || socket.handshake.query.token;
      
      if (!token) {
        return next(new Error('Se requiere autenticación'));
      }
      
      // Verificar token
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      
      // Buscar usuario
      const user = await User.findById(decoded.userId).select('-password');
      
      if (!user) {
        return next(new Error('Usuario no encontrado'));
      }
      
      // Adjuntar datos del usuario al socket
      socket.user = user;
      
      next();
    } catch (error) {
      logger.error(`Error de autenticación de WebSockets: ${error.message}`);
      next(new Error('Token inválido'));
    }
  });
  
  // Gestionar conexiones
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    
    logger.info(`Usuario ${userId} conectado por WebSocket`);
    
    // Unir al usuario a su sala personal
    socket.join(`user:${userId}`);
    
    // Si es admin, unirlo a la sala de administradores
    if (socket.user.role === 'admin') {
      socket.join('admins');
    }
    
    // Notificar al usuario conectado
    socket.emit('connection_established', {
      message: 'Conexión establecida exitosamente',
      userId: userId
    });
    
    // Eventos de tarea
    socket.on('task:subscribe', (taskId) => {
      socket.join(`task:${taskId}`);
    });
    
    socket.on('task:unsubscribe', (taskId) => {
      socket.leave(`task:${taskId}`);
    });
    
    // Eventos de evento
    socket.on('event:subscribe', (eventId) => {
      socket.join(`event:${eventId}`);
    });
    
    socket.on('event:unsubscribe', (eventId) => {
      socket.leave(`event:${eventId}`);
    });
    
    // Desconexión
    socket.on('disconnect', () => {
      logger.info(`Usuario ${userId} desconectado de WebSocket`);
    });
  });
  
  // Exponer funciones para emitir eventos desde otras partes de la aplicación
  io.taskUpdated = (taskId, taskData) => {
    io.to(`task:${taskId}`).emit('task:updated', taskData);
  };
  
  io.taskCreated = (userId, taskData) => {
    io.to(`user:${userId}`).emit('task:created', taskData);
  };
  
  io.taskDeleted = (taskId, userId) => {
    io.to(`task:${taskId}`).emit('task:deleted', { taskId });
    io.to(`user:${userId}`).emit('task:deleted', { taskId });
  };
  
  io.eventUpdated = (eventId, eventData) => {
    io.to(`event:${eventId}`).emit('event:updated', eventData);
  };
  
  io.notifyUser = (userId, notification) => {
    io.to(`user:${userId}`).emit('notification', notification);
  };
  
  io.broadcastToAdmins = (event, data) => {
    io.to('admins').emit(event, data);
  };
  
  return io;
};

module.exports = setupWebSockets;