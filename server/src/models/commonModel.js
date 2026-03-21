import pool from '../config/db.js';

class CommonModel {
  async getAllGroups() {
    const [rows] = await pool.query('SELECT id, name FROM \`group\`');
    return rows;
  }
}

export default new CommonModel();
