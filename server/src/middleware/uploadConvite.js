import multer from 'multer';
import path from 'path';
import fs from 'fs';

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const dir = 'uploads/convites';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const filename = `convite_${Date.now()}${ext}`;
    cb(null, filename);
  }
});

export const uploadConvite = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const tiposPermitidos = ['image/jpeg', 'image/png'];
    if (tiposPermitidos.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Formato inválido. Use JPEG ou PNG.'));
    }
  },
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
});
