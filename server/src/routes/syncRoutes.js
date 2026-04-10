import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import syncController from '../controllers/syncController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseLogPath = path.resolve(__dirname, '../../../log');

if (!fs.existsSync(baseLogPath)) {
  try {
    fs.mkdirSync(baseLogPath, { recursive: true });
  } catch (e) {
    console.error('[SYNC] 无法创建 log 目录:', e);
  }
}

// 文件存储配置：按训练开始日期分目录，文件名按开始时间命名
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dateStr;
    try {
      if (req.body.record_info) {
        dateStr = JSON.parse(req.body.record_info).begin_time?.split(' ')[0];
      }
    } catch (e) {}

    if (!dateStr) {
      const today = new Date();
      dateStr =
        today.getFullYear() +
        '-' + String(today.getMonth() + 1).padStart(2, '0') +
        '-' + String(today.getDate()).padStart(2, '0');
    }

    const dir = path.join(baseLogPath, dateStr);
    try {
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      cb(null, dir);
    } catch (err) {
      console.error('[SYNC] multer destination 错误:', err);
      cb(err);
    }
  },

  filename: function (req, file, cb) {
    let timeStr;
    try {
      if (req.body.record_info) {
        timeStr = JSON.parse(req.body.record_info).begin_time
          ?.split(' ')[1]
          ?.replace(/:/g, '-');
      }
    } catch (e) {}

    if (!timeStr) {
      const now = new Date();
      timeStr =
        String(now.getHours()).padStart(2, '0') + '-' +
        String(now.getMinutes()).padStart(2, '0') + '-' +
        String(now.getSeconds()).padStart(2, '0');
    }

    cb(null, `${timeStr}.csv`);
  }
});

const upload = multer({ storage });

const router = express.Router();

// 平板端合包同步接口
// POST /api/sync/training_data
// 字段：user_info(JSON), record_info(JSON), raw_data(file)
router.post('/training_data', upload.single('raw_data'), syncController.syncTrainingData);

export default router;
