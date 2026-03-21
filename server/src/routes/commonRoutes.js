import express from 'express';
import commonController from '../controllers/commonController.js';

const router = express.Router();

router.get('/groups', commonController.getGroups);
router.get('/metadata', commonController.getMetadata);

export default router;
