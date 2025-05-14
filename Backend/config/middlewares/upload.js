// backend/middlewares/upload.js
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { createError } = require('../../utils/errorHandler');

// Configurar almacenamiento para multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Definir la carpeta de destino según el tipo de archivo
    let uploadDir = '';
    
    if (file.fieldname === 'profilePicture') {
      uploadDir = path.join(__dirname, '../../uploads/profiles');
    } else if (file.fieldname === 'taskAttachment') {
      uploadDir = path.join(__dirname, '../../uploads/attachments');
    } else {
      uploadDir = path.join(__dirname, '../../uploads/misc');
    }
    
    // Crear el directorio si no existe
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generar un nombre único para el archivo
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

// Filtrar tipos de archivos permitidos
const fileFilter = (req, file, cb) => {
  // Definir tipos MIME permitidos según el tipo de campo
  const allowedMimeTypes = {
    profilePicture: ['image/jpeg', 'image/png', 'image/gif'],
    taskAttachment: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain']
  };
  
  const allowedTypes = allowedMimeTypes[file.fieldname] || [];
  
  if (allowedTypes.length > 0 && allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(createError(400, 'Formato de archivo no permitido'), false);
  }
};

// Configuración para perfiles de usuario (imágenes)
const uploadProfilePicture = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5 MB máximo
  }
}).single('profilePicture');

// Configuración para archivos adjuntos de tareas
const uploadTaskAttachment = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB máximo
  }
}).single('taskAttachment');

// Middleware para manejar errores de multer
const handleUploadErrors = (uploadFunction) => {
  return (req, res, next) => {
    uploadFunction(req, res, (err) => {
      if (err) {
        if (err instanceof multer.MulterError) {
          // Errores específicos de multer
          if (err.code === 'LIMIT_FILE_SIZE') {
            return next(createError(400, 'El archivo es demasiado grande'));
          }
          return next(createError(400, `Error de carga: ${err.message}`));
        }
        
        // Otros errores
        return next(err);
      }
      
      next();
    });
  };
};

module.exports = {
  handleProfilePictureUpload: handleUploadErrors(uploadProfilePicture),
  handleTaskAttachmentUpload: handleUploadErrors(uploadTaskAttachment)
};