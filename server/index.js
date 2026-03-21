import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import pool from './src/config/db.js';
import userRoutes from './src/routes/userRoutes.js';
import trainRoutes from './src/routes/trainRoutes.js';
import commonRoutes from './src/routes/commonRoutes.js';
import authRoutes from './src/routes/authRoutes.js';
import authMiddleware from './src/middleware/authMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// 公开路由 (无需令牌)
app.use('/api/auth', authRoutes);

// 需要身份验证的路由 (保镖拦截)
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/trains', authMiddleware, trainRoutes);
app.use('/api/common', authMiddleware, commonRoutes);

// 健康检查与数据库状态
app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ 
      status: 'ok', 
      database: 'connected',
      serverTime: new Date().toISOString() 
    });
  } catch (error) {
    res.status(500).json({ 
      status: 'error', 
      database: 'disconnected', 
      error: error.message 
    });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 后端服务器运行在: http://localhost:${PORT}`);
});
