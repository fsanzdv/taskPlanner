// backend/server.js
require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');
const setupWebSockets = require('./config/websocket');
const logger = require('./utils/logger');
const { errorHandler } = require('./utils/errorHandler');

// Importar rutas
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const eventRoutes = require('./routes/events');
const adminRoutes = require('./routes/admin');

// Crear aplicación Express
const app = express();

// Crear servidor HTTP
const server = http.createServer(app);

// Conectar a MongoDB
connectDB();

// Configurar middleware
app.use(helmet()); // Seguridad
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));
app.use(express.json()); // Parsear JSON
app.use(express.urlencoded({ extended: true })); // Parsear URL-encoded

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Directorio estático para archivos subidos
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Configurar rutas
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/admin', adminRoutes);

// Ruta de verificación de estado
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'OK',
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV
  });
});

// Configurar WebSockets
const io = setupWebSockets(server);

// Hacer disponible io en la aplicación Express
app.io = io;

// Middleware para manejo de errores
app.use(errorHandler);

// Manejo de rutas no encontradas
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Ruta no encontrada'
  });
});

// Configurar puerto
const PORT = process.env.PORT || 5000;

// Iniciar servidor
server.listen(PORT, () => {
  logger.info(`Servidor iniciado en el puerto ${PORT} en modo ${process.env.NODE_ENV}`);
});

// Manejo de errores no capturados
process.on('unhandledRejection', (err) => {
  logger.error(`Error no manejado: ${err.message}`);
  logger.error(err.stack);
});

process.on('uncaughtException', (err) => {
  logger.error(`Excepción no capturada: ${err.message}`);
  logger.error(err.stack);
  process.exit(1);
});