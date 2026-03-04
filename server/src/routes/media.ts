import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { upload } from '../middleware/upload';

const router = Router();

// Загрузка файла с обработкой ошибок multer
router.post('/upload', (req: Request, res: Response, next: NextFunction) => {
  upload.single('file')(req, res, (err: any) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: 'Файл слишком большой. Максимум — 200 МБ' });
      }
      return res.status(400).json({ error: `Ошибка загрузки: ${err.message}` });
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Неподдерживаемый формат файла' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Файл не загружен' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    res.json({ url: fileUrl });
  });
});

export default router;