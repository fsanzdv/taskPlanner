// backend/routes/tasks.js
const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../config/middlewares/auth');
const { handleTaskAttachmentUpload } = require('../config/middlewares/upload');

// Todas las rutas requieren autenticación
router.use(authenticate);

// Rutas de tareas
router.post('/', taskController.createTask);
router.get('/', taskController.getTasks);
router.get('/:id', taskController.getTaskById);
router.put('/:id', taskController.updateTask);
router.delete('/:id', taskController.deleteTask);

// Rutas para archivos adjuntos
router.post('/:id/attachments', handleTaskAttachmentUpload, taskController.addAttachment);
router.delete('/:taskId/attachments/:attachmentId', taskController.removeAttachment);

module.exports = router;