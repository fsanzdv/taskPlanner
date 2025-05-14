// backend/config/db.js
const mongoose = require('mongoose');
const logger = require('../utils/logger');

// Opciones de conexión a MongoDB
const connectOptions = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  autoIndex: true // Para entornos de producción, considere establecer esto en false
};

// Función para conectar a MongoDB
const connectDB = async () => {
  try {
    // Obtener la URL de MongoDB desde las variables de entorno
    const mongoURI = process.env.MONGO_URI;
    
    if (!mongoURI) {
      throw new Error('La variable de entorno MONGO_URI no está definida');
    }
    
    // Conectar a MongoDB
    const connection = await mongoose.connect(mongoURI, connectOptions);
    
    logger.info(`MongoDB conectado: ${connection.connection.host}`);
    
    // Manejadores de eventos para la conexión
    mongoose.connection.on('error', (err) => {
      logger.error(`Error de MongoDB: ${err}`);
    });
    
    mongoose.connection.on('disconnected', () => {
      logger.warn('MongoDB desconectado');
    });
    
    // Manejar señales de terminación para cerrar la conexión correctamente
    process.on('SIGINT', async () => {
      await mongoose.connection.close();
      logger.info('Conexión a MongoDB cerrada debido a la terminación de la aplicación');
      process.exit(0);
    });
    
    return connection;
  } catch (error) {
    logger.error(`Error al conectar a MongoDB: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;