import userService from '../services/userService.js';

class UserController {
  async getUsers(req, res) {
    try {
      const { page = 1, pageSize = 12, name, userId, groupId } = req.query;
      const users = await userService.listUsers({ name, userId, groupId }, page, pageSize);
      res.json(users);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getUserById(req, res) {
    try {
      const { id } = req.params;
      const user = await userService.getUserProfile(id);
      if (!user) return res.status(404).json({ message: '用户不存在' });
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 专用分页/筛选/排序接口：GET /api/users/:id/records
  async getUserRecords(req, res) {
    try {
      const { id } = req.params;
      const { 
        page = 1, 
        pageSize = 10, 
        typeId, 
        partId, 
        startDate, 
        endDate, 
        sortBy, 
        sortOrder 
      } = req.query;
      
      const result = await userService.getUserRecords(id, { 
        page, 
        pageSize, 
        typeId, 
        partId, 
        startDate, 
        endDate, 
        sortBy, 
        sortOrder 
      });
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取趋势数据：GET /api/users/:id/trend?typeId=1
  async getUserTrend(req, res) {
    try {
      const { id } = req.params;
      const { typeId = 1, limit = 20 } = req.query;
      const data = await userService.getUserTrend(id, typeId, limit);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  // 获取个人巅峰时刻：GET /api/users/:id/glory
  async getUserGloryMoments(req, res) {
    try {
      const { id } = req.params;
      const data = await userService.getUserGloryMoments(id);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new UserController();
