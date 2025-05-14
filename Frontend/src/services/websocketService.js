// frontend/src/services/websocketService.js
import { io } from 'socket.io-client';
import authService from './authService';

/**
 * Servicio de WebSockets para el frontend
 */
class WebSocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
    this.connected = false;
  }
  
  /**
   * Conecta al servidor de WebSockets
   * @returns {Promise} - Promesa que se resuelve cuando se establece la conexión
   */
  connect() {
    return new Promise((resolve, reject) => {
      if (this.connected && this.socket) {
        resolve();
        return;
      }
      
      // Obtener token de autenticación
      const token = localStorage.getItem('token');
      
      if (!token) {
        reject(new Error('No hay sesión activa'));
        return;
      }
      
      // Configurar socket
      this.socket = io(process.env.REACT_APP_WEBSOCKET_URL || window.location.origin, {
        auth: {
          token
        }
      });
      
      // Manejar eventos de conexión
      this.socket.on('connect', () => {
        console.log('WebSocket conectado');
        this.connected = true;
        resolve();
      });
      
      this.socket.on('connect_error', (error) => {
        console.error('Error de conexión WebSocket:', error.message);
        this.connected = false;
        reject(error);
      });
      
      this.socket.on('disconnect', (reason) => {
        console.log('WebSocket desconectado:', reason);
        this.connected = false;
        
        // Reconectar automáticamente si la sesión sigue activa
        if (authService.isAuthenticated()) {
          setTimeout(() => {
            this.connect().catch(console.error);
          }, 3000);
        }
      });
      
      // Configurar listeners predeterminados
      this.setupDefaultListeners();
    });
  }
  
  /**
   * Configura listeners predeterminados
   */
  setupDefaultListeners() {
    // Notificaciones
    this.socket.on('notification', (data) => {
      this.triggerListeners('notification', data);
    });
    
    // Tareas
    this.socket.on('task:created', (data) => {
      this.triggerListeners('task:created', data);
    });
    
    this.socket.on('task:updated', (data) => {
      this.triggerListeners('task:updated', data);
    });
    
    this.socket.on('task:deleted', (data) => {
      this.triggerListeners('task:deleted', data);
    });
    
    // Eventos
    this.socket.on('event:created', (data) => {
      this.triggerListeners('event:created', data);
    });
    
    this.socket.on('event:updated', (data) => {
      this.triggerListeners('event:updated', data);
    });
    
    this.socket.on('event:deleted', (data) => {
      this.triggerListeners('event:deleted', data);
    });
  }
  
  /**
   * Desconecta del servidor de WebSockets
   */
  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
      this.listeners.clear();
    }
  }
  
  /**
   * Añade un listener para un evento
   * @param {String} event - Nombre del evento
   * @param {Function} callback - Función a ejecutar
   * @param {String} id - Identificador del listener (opcional)
   * @returns {String} - Identificador del listener
   */
  addListener(event, callback, id = null) {
    const listenerId = id || `${event}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Map());
    }
    
    this.listeners.get(event).set(listenerId, callback);
    
    return listenerId;
  }
  
  /**
   * Elimina un listener
   * @param {String} event - Nombre del evento
   * @param {String} id - Identificador del listener
   */
  removeListener(event, id) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).delete(id);
    }
  }
  
  /**
   * Ejecuta todos los listeners de un evento
   * @param {String} event - Nombre del evento
   * @param {*} data - Datos del evento
   */
  triggerListeners(event, data) {
    if (this.listeners.has(event)) {
      for (const callback of this.listeners.get(event).values()) {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error en listener de ${event}:`, error);
        }
      }
    }
  }
  
  /**
   * Suscribe a actualizaciones de una tarea
   * @param {String} taskId - ID de la tarea
   */
  subscribeToTask(taskId) {
    if (this.connected && this.socket) {
      this.socket.emit('task:subscribe', taskId);
    }
  }
  
  /**
   * Cancela suscripción a actualizaciones de una tarea
   * @param {String} taskId - ID de la tarea
   */
  unsubscribeFromTask(taskId) {
    if (this.connected && this.socket) {
      this.socket.emit('task:unsubscribe', taskId);
    }
  }
  
  /**
   * Suscribe a actualizaciones de un evento
   * @param {String} eventId - ID del evento
   */
  subscribeToEvent(eventId) {
    if (this.connected && this.socket) {
      this.socket.emit('event:subscribe', eventId);
    }
  }
  
  /**
   * Cancela suscripción a actualizaciones de un evento
   * @param {String} eventId - ID del evento
   */
  unsubscribeFromEvent(eventId) {
    if (this.connected && this.socket) {
      this.socket.emit('event:unsubscribe', eventId);
    }
  }
}

// Crear una instancia única
const websocketService = new WebSocketService();

export default websocketService;