import pool from '../config/db.js';

class GroupService {
  /**
   * 查找或创建组别
   * @param {string} name 组别名称
   * @returns {Promise<number>} 组别的 ID
   */
  async findOrCreate(name) {
    if (!name) return null;
    
    // 1. 尝试查找
    const [rows] = await pool.query('SELECT id FROM `group` WHERE name = ? LIMIT 1', [name]);
    if (rows.length > 0) {
      return rows[0].id;
    }
    
    // 2. 如果不存在则创建
    try {
      const [result] = await pool.query('INSERT INTO `group` (name) VALUES (?)', [name]);
      return result.insertId;
    } catch (e) {
      // 防止并发写入导致唯一索引冲突
      const [retryRows] = await pool.query('SELECT id FROM `group` WHERE name = ? LIMIT 1', [name]);
      if (retryRows.length > 0) {
        return retryRows[0].id;
      }
      throw e;
    }
  }

  /**
   * 专供 API 调用创建组别
   */
  async createGroup(name) {
    const id = await this.findOrCreate(name);
    return { id, name };
  }
}

export default new GroupService();
