import pool from '../config/db.js';

class TrainModel {
  /**
   * 获取测试记录分页/过滤列表 (直接关联 test_record 及各维度表)
   */
  async getTrainRecords(filters = {}, page = 1, pageSize = 12) {
    const offset = (page - 1) * pageSize;
    
    // 逻辑：直接查询物理表以绕过视图可能存在的其他限制，手动进行关联
    let sql = `
      FROM test_record tr
      JOIN user u ON tr.uid = u.id
      LEFT JOIN test_type tt ON tr.type = tt.id
      LEFT JOIN body_part bp ON tr.part = bp.id
      LEFT JOIN \`group\` g ON u.group = g.id
      WHERE tr.end_time IS NOT NULL
    `;
    const params = [];

    // 筛选条件构建
    if (filters.uid) {
      sql += ' AND tr.uid = ?';
      params.push(filters.uid);
    }
    if (filters.userName) {
      sql += ' AND u.name LIKE ?';
      params.push(`%${filters.userName}%`);
    }
    if (filters.groupId && filters.groupId !== 'all') {
      sql += ' AND u.group = ?';
      params.push(filters.groupId);
    }
    if (filters.typeId && filters.typeId !== 'all') {
      sql += ' AND tr.type = ?';
      params.push(filters.typeId);
    }
    if (filters.partId && filters.partId !== 'all') {
      sql += ' AND tr.part = ?';
      params.push(filters.partId);
    }
    if (filters.startDate) {
      sql += ' AND tr.begin_time >= ?';
      params.push(`${filters.startDate} 00:00:00`);
    }
    if (filters.endDate) {
      sql += ' AND tr.begin_time <= ?';
      params.push(`${filters.endDate} 23:59:59`);
    }
    
    // 排序逻辑映射 (防止 SQL 注入)
    const allowedSortFields = {
      'uid': 'tr.uid',
      'type_name': 'tt.name',
      'time': 'tr.begin_time',
      'con_stre_max': 'tr.con_stre_max',
      'config_value': 'tr.begin_time' // 默认占位
    };

    // 如果是配置列排序，则根据训练类型动态选择字段
    if (filters.sortBy === 'config_value') {
      const typeId = parseInt(filters.typeId);
      if (typeId === 1) allowedSortFields['config_value'] = 'tr.cfg_con_speed';
      else if (typeId === 2) allowedSortFields['config_value'] = 'tr.cfg_stre';
      else if (typeId === 3) allowedSortFields['config_value'] = 'tr.cfg_pos';
    }

    const sortBy = allowedSortFields[filters.sortBy] || 'tr.begin_time';
    const sortOrder = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';

    // 按开始时间倒序排序 (替换为动态排序)
    const dataSql = `
      SELECT 
        tr.id, 
        tr.uid,
        tr.type AS type_id, 
        u.name AS user_name, 
        g.name AS group_name, 
        tt.name AS type_name, 
        bp.name AS part_name, 
        tr.begin_time AS time,
        tr.con_stre_max,
        tr.cfg_con_speed,
	tr.cfg_stre,
	tr.cfg_pos,
        tr.cfg_group,
        tr.cfg_rest_time
      ${sql} 
      ORDER BY ${sortBy} ${sortOrder} 
      LIMIT ? OFFSET ?
    `;
    const countSql = `SELECT COUNT(*) as total ${sql}`;
    
    const [rows] = await pool.query(dataSql, [...params, parseInt(pageSize), parseInt(offset)]);
    const [[{ total }]] = await pool.query(countSql, params);
    
    return { data: rows, total };
  }

  async getRecordDetail(id) {
    const sql = `
      SELECT 
        tr.*,
        tr.type AS type_id,
        u.name AS user_name,
        COALESCE(TIMESTAMPDIFF(YEAR, u.birthday, tr.begin_time), u.age) AS age,
        u.height,
        u.weight,
        g.name AS gender_name,
        gp.name AS group_name,
        tt.name AS type_name,
        bp.name AS part_name,
        tr.begin_time AS time
      FROM test_record tr
      JOIN user u ON tr.uid = u.id
      LEFT JOIN gender g ON u.gender = g.id
      LEFT JOIN \`group\` gp ON u.group = gp.id
      LEFT JOIN test_type tt ON tr.type = tt.id
      LEFT JOIN body_part bp ON tr.part = bp.id
      WHERE tr.id = ?
    `;
    const [rows] = await pool.query(sql, [id]);
    return rows[0];
  }

  /**
   * 获取排行榜数据 (基于 test_record 物理表)
   */
  async getRankingData(typeId, metric, limit = 50) {
    // 1. 定义基础指标白名单 (物理列)
    const baseMetrics = [
      'con_stre_max', 'con_stre_avg', 'con_speed_max', 'con_speed_avg', 
      'con_power_max', 'con_power_avg', 'con_work_max', 'con_work_avg',
      'ecc_stre_max', 'ecc_stre_avg', 'ecc_speed_max', 'ecc_speed_avg',
      'ecc_power_max', 'ecc_power_avg', 'ecc_work_max', 'ecc_work_avg'
    ];
    
    // 2. 处理“相对”指标逻辑
    let scoreSql = '';
    if (metric.startsWith('rel_')) {
      const actualBase = metric.replace('rel_', '');
      if (!baseMetrics.includes(actualBase)) throw new Error('Invalid relative metric');
      // 相对指标 = 物理值 / 体重 (u.weight)
      scoreSql = `(tr.${actualBase} / NULLIF(u.weight, 0))`;
    } else {
      if (!baseMetrics.includes(metric)) throw new Error('Invalid ranking metric');
      scoreSql = `tr.${metric}`;
    }

    const sql = `
      WITH RankedRecords AS (
        SELECT 
          tr.id AS recordId,
          tr.uid AS userId,
          ${scoreSql} AS score,
          tr.cfg_con_speed,
          tr.cfg_stre,
          tr.cfg_pos,
          tr.cfg_roma,
          tr.cfg_romb,
          tr.part,
          tr.begin_time AS time,
          ROW_NUMBER() OVER (PARTITION BY tr.uid ORDER BY ${scoreSql} DESC, tr.id DESC) as rn
        FROM test_record tr
        JOIN user u ON tr.uid = u.id
        WHERE tr.type = ? AND tr.end_time IS NOT NULL
      )
      SELECT 
        r.recordId,
        r.userId,
        u.name,
        g.name as \`group\`,
        bp.name as joint,
        r.score,
        r.cfg_con_speed,
        r.cfg_stre,
        r.cfg_pos,
        r.cfg_roma,
        r.cfg_romb,
        r.time
      FROM RankedRecords r
      JOIN user u ON r.userId = u.id
      LEFT JOIN \`group\` g ON u.group = g.id
      LEFT JOIN body_part bp ON r.part = bp.id
      WHERE r.rn = 1
      ORDER BY r.score DESC
      LIMIT ?
    `;

    const [rows] = await pool.query(sql, [parseInt(typeId), parseInt(limit)]);
    return rows;
  }

  async insertRecord(data) {
    const columns = Object.keys(data).join(', ');
    const placeholders = Object.keys(data).map(() => '?').join(', ');
    const sql = `INSERT INTO test_record (${columns}) VALUES (${placeholders})`;
    
    // 动态提取值以防 SQL 注入
    const [result] = await pool.query(sql, Object.values(data));
    return result.insertId;
  }
}

export default new TrainModel();
