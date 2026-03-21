import express from 'express';
import trainController from '../controllers/trainController.js';

const router = express.Router();

router.get('/records', trainController.getRecords);
router.get('/detail/:id', trainController.getDetail);
router.get('/ranking', trainController.getRanking);

export default router;
