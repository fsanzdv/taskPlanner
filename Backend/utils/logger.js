// backend/utils/logger.js
const winston = require('winston');
const path = require('path');

// Definir niveles de log personalizados
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Definir colores para cada nivel de log (para consola)
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Añadir colores a winston
winston.addColors(colors);

// Función para determinar el nivel de log según el entorno
const level = () => {
  const env = process.env.NODE_ENV || 'development';
  return env === 'development' ? 'debug' : 'info';
};

// Formato personalizado para logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json()
);

// Formato para logs de consola
const consoleFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.printf(
    info => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Definir transports (destinos de logs)
const transports = [
  // Logs de consola
  new winston.transports.Console({
    format: consoleFormat
  }),
  
  // Logs de error en archivo
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/error.log'),
    level: 'error'
  }),
  
  // Logs generales en archivo
  new winston.transports.File({
    filename: path.join(__dirname, '../../logs/combined.log')
  })
];

// Crear instancia de logger
const logger = winston.createLogger({
  level: level(),
  levels,
  format,
  transports
});

// Si no estamos en producción, log a la consola con el formato personalizado
if (process.env.NODE_ENV !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  );
}

module.exports = logger;