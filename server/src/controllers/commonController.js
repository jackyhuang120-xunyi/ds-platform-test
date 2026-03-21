import pool from '../config/db.js';

class CommonController {
  async getGroups(req, res) {
    try {
      const [rows] = await pool.query('SELECT id, name FROM `group`');
      res.json(rows);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  /**
   * 获取所有元数据（组别、测试类型、部位）
   */
  async getMetadata(req, res) {
    try {
      // 1. 获取基础字典数据
      const [groups] = await pool.query('SELECT id, name FROM `group`');
      const [types] = await pool.query('SELECT id, name FROM test_type');
      const [parts] = await pool.query('SELECT id, name FROM body_part');

      // 2. 计算 99% 分位数基准 (Baselines)
      const getP99 = async (metric, typeId) => {
        const [rows] = await pool.query(`
          SELECT ${metric} as val 
          FROM test_record 
          WHERE type = ? AND end_time IS NOT NULL 
          ORDER BY ${metric} ASC
        `, [typeId]);
        if (rows.length === 0) return null;
        const index = Math.max(0, Math.floor(rows.length * 0.99) - 1);
        return rows[index].val;
      };

      const [isoKConP99, isoKEccP99, isoTSpeedP99, isoMStreP99] = await Promise.all([
        getP99('con_stre_max', 1),
        getP99('ecc_stre_max', 1),
        getP99('con_speed_max', 2),
        getP99('con_stre_max', 3)
      ]);

      // 3. 计算“活跃度” P99 (按用户分组统计总次数)
      const [activityRows] = await pool.query(`
        SELECT count_val FROM (
          SELECT COUNT(*) as count_val 
          FROM test_record 
          WHERE end_time IS NOT NULL 
          GROUP BY uid
        ) t 
        ORDER BY count_val ASC
      `);
      let activityP99 = 50; // 默认值
      if (activityRows.length > 0) {
        const idx = Math.max(0, Math.floor(activityRows.length * 0.99) - 1);
        activityP99 = activityRows[idx].count_val;
      }

      res.json({
        groups,
        types,
        parts,
        baselines: {
          isokinetic_con: isoKConP99 || 220,
          isokinetic_ecc: isoKEccP99 || 220,
          isotonic_speed: isoTSpeedP99 || 1000,
          isometric_stre: isoMStreP99 || 220,
          activity: activityP99 || 50
        }
      });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
}

export default new CommonController();
