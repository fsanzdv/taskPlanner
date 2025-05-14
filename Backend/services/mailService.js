// backend/services/mailService.js
const nodemailer = require('nodemailer');
const fs = require('fs').promises;
const path = require('path');
const handlebars = require('handlebars');
const logger = require('../utils/logger');

/**
 * Servicio de correo electrónico - Gestiona el envío de correos
 * Principio de responsabilidad única (S de SOLID)
 */
class MailService {
  constructor() {
    // Crear transporte de nodemailer
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: process.env.MAIL_PORT,
      secure: process.env.MAIL_SECURE === 'true',
      auth: {
        user: process.env.MAIL_USER,
        pass: process.env.MAIL_PASSWORD
      }
    });
    
    // Verificar conexión en inicio
    this.verifyConnection();
    
    // Compilar plantillas
    this.templates = {};
    this.loadTemplates();
  }
  
  /**
   * Verifica la conexión con el servidor de correo
   */
  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Conexión con servidor de correo establecida correctamente');
    } catch (error) {
      logger.error(`Error al conectar con servidor de correo: ${error.message}`);
    }
  }
  
  /**
   * Carga y compila las plantillas de correo
   */
  async loadTemplates() {
    try {
      const templatesDir = path.join(__dirname, '../templates/emails');
      
      // Lista de plantillas a cargar
      const templateFiles = {
        welcome: 'welcome.html',
        taskReminder: 'task-reminder.html',
        passwordReset: 'password-reset.html',
        newEvent: 'new-event.html'
      };
      
      // Cargar cada plantilla
      for (const [name, file] of Object.entries(templateFiles)) {
        const templatePath = path.join(templatesDir, file);
        const templateContent = await fs.readFile(templatePath, 'utf8');
        this.templates[name] = handlebars.compile(templateContent);
      }
      
      logger.info('Plantillas de correo cargadas y compiladas correctamente');
    } catch (error) {
      logger.error(`Error al cargar plantillas de correo: ${error.message}`);
    }
  }
  
  /**
   * Envía un correo electrónico
   * @param {Object} options - Opciones del correo
   * @returns {Boolean} - Resultado del envío
   */
  async sendMail(options) {
    try {
      const { to, subject, template, context, attachments = [] } = options;
      
      // Verificar que la plantilla existe
      if (!this.templates[template]) {
        throw new Error(`Plantilla '${template}' no encontrada`);
      }
      
      // Renderizar HTML con datos del contexto
      const html = this.templates[template](context);
      
      // Configuración del correo
      const mailOptions = {
        from: `"${process.env.MAIL_FROM_NAME}" <${process.env.MAIL_FROM_EMAIL}>`,
        to,
        subject,
        html,
        attachments
      };
      
      // Enviar correo
      const info = await this.transporter.sendMail(mailOptions);
      
      logger.info(`Correo enviado a ${to}: ${info.messageId}`);
      return true;
    } catch (error) {
      logger.error(`Error al enviar correo: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Envía correo de bienvenida a un nuevo usuario
   * @param {Object} user - Datos del usuario
   * @returns {Boolean} - Resultado del envío
   */
  async sendWelcomeEmail(user) {
    return this.sendMail({
      to: user.email,
      subject: '¡Bienvenido a TaskPlanner!',
      template: 'welcome',
      context: {
        username: user.username,
        appUrl: process.env.FRONTEND_URL
      }
    });
  }
  
  /**
   * Envía recordatorio de tarea próxima a vencer
   * @param {Object} task - Datos de la tarea
   * @param {Object} user - Datos del usuario
   * @returns {Boolean} - Resultado del envío
   */
  async sendTaskReminder(task, user) {
    return this.sendMail({
      to: user.email,
      subject: `Recordatorio: Tarea "${task.title}" próxima a vencer`,
      template: 'taskReminder',
      context: {
        username: user.username,
        taskTitle: task.title,
        taskDescription: task.description,
        dueDate: new Date(task.dueDate).toLocaleDateString(),
        status: task.status,
        city: task.city,
        weather: task.weatherData?.description || 'Información no disponible',
        temperature: task.weatherData?.temperature || 'N/A',
        taskUrl: `${process.env.FRONTEND_URL}/tasks/${task._id}`
      }
    });
  }
  
  /**
   * Envía correo para restablecer contraseña
   * @param {Object} user - Datos del usuario
   * @param {String} resetToken - Token para restablecer contraseña
   * @returns {Boolean} - Resultado del envío
   */
  async sendPasswordResetEmail(user, resetToken) {
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    
    return this.sendMail({
      to: user.email,
      subject: 'Restablecimiento de contraseña - TaskPlanner',
      template: 'passwordReset',
      context: {
        username: user.username,
        resetUrl,
        expiryTime: '1 hora'
      }
    });
  }
  
  /**
   * Envía notificación de nuevo evento
   * @param {Object} event - Datos del evento
   * @param {Object} user - Datos del usuario creador
   * @param {Array} attendees - Lista de usuarios invitados
   * @returns {Array} - Resultados de envíos
   */
  async sendNewEventNotifications(event, user, attendees) {
    const results = [];
    
    for (const attendee of attendees) {
      const result = await this.sendMail({
        to: attendee.email,
        subject: `Invitación al evento: ${event.title}`,
        template: 'newEvent',
        context: {
          username: attendee.username,
          eventTitle: event.title,
          eventDescription: event.description,
          organizer: user.username,
          startDate: new Date(event.startDate).toLocaleString(),
          endDate: new Date(event.endDate).toLocaleString(),
          location: event.location,
          eventUrl: `${process.env.FRONTEND_URL}/events/${event._id}`
        }
      });
      
      results.push({
        email: attendee.email,
        sent: result
      });
    }
    
    return results;
  }
}

module.exports = new MailService();