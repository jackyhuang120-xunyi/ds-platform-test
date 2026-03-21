import express from 'express';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import trainController from '../controllers/trainController.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const baseLogPath = path.resolve(__dirname, '../../../log');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    let dateStr;
    try {
      if (req.body.record_data) {
        dateStr = JSON.parse(req.body.record_data).begin_time.split(' ')[0];
      }
    } catch(e) {}
    if (!dateStr) {
      const today = new Date();
      dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
    }
    const dir = path.join(baseLogPath, dateStr);
    
    if (!fs.existsSync(dir)){
        fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: function (req, file, cb) {
    let timeStr;
    try {
      if (req.body.record_data) {
        timeStr = JSON.parse(req.body.record_data).begin_time.split(' ')[1].replace(/:/g, '-');
      }
    } catch(e) {}
    if (!timeStr) {
      const today = new Date();
      timeStr = String(today.getHours()).padStart(2,'0') + '-' + String(today.getMinutes()).padStart(2,'0') + '-' + String(today.getSeconds()).padStart(2,'0');
    }
    cb(null, `${timeStr}.csv`);
  }
});
const upload = multer({ storage: storage });

const router = express.Router();

router.get('/records', trainController.getRecords);
router.get('/detail/:id', trainController.getDetail);
router.get('/ranking', trainController.getRanking);
router.post('/upload', upload.single('log_file'), trainController.uploadRecord);

export default router;
