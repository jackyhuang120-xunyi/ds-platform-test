import userService from '../services/userService.js';

class UserController {
  async getUsers(req, res) {
    try {
      const { page = 1, pageSize = 12, name, userId, groupId, birthday } = req.query;
      
      // 场景：精准查重（身份锚定）
      if (name && birthday) {
        const users = await userService.listUsers({ name, birthday }, 1, 1);
        if (users.data && users.data.length > 0) {
          return res.status(200).json(users.data[0]);
        } else {
          return res.status(404).json({ message: '查无此人' });
        }
      }

      const users = await userService.listUsers({ name, userId, groupId }, page, pageSize);
      res.status(200).json(users);
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
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

  // 创建新用户：POST /api/users
  async createUser(req, res) {
    try {
      const userData = req.body;
      if (!userData.name || !userData.birthday) {
        return res.status(400).json({ message: '姓名和生日不能为空' });
      }

      const result = await userService.idempotentCreate(userData);
      
      if (!result.isNew) {
        // 幂等命中：已存在则返回 200 + 原有数据
        return res.status(200).json({ 
          message: '用户已存在', 
          id: result.id, 
          data: result.data 
        });
      }

      res.status(201).json({ id: result.id, message: '用户录入成功' });
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }

  // 全量覆盖更新：PUT /api/users/:id
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const userData = req.body;
      
      const success = await userService.updateUser(id, userData);
      if (success) {
        res.status(200).json({ success: true, message: '档案更新成功' });
      } else {
        res.status(404).json({ message: '更新失败，用户可能不存在' });
      }
    } catch (error) {
      res.status(500).json({ status: 'error', message: error.message });
    }
  }
}

export default new UserController();
