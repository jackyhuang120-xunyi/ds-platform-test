import express from 'express';
import userController from '../controllers/userController.js';

const router = express.Router();

router.get('/', userController.getUsers);
router.get('/:id', userController.getUserById);
router.get('/:id/records', userController.getUserRecords);
router.get('/:id/trend', userController.getUserTrend);
router.get('/:id/glory', userController.getUserGloryMoments);
router.post('/', userController.createUser);

export default router;
