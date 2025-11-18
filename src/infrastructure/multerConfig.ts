import multer from 'multer';

// Configurar Multer para guardar archivos en memoria
const storage = multer.memoryStorage();

// Configurar límites y filtros
export const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB máximo
    files: 5 // Máximo 5 archivos por ticket
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de archivo no permitido. Solo: JPG, PNG, GIF, WEBP, PDF'));
    }
  }
});