import pool from '../config/db.js';

class UserModel {
  /**
   * 获取所有活跃用户 (从 user_view)
   */
  async getAllUsers(filters = {}, page = 1, pageSize = 12) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE 1=1';
    const params = [];

    if (filters.name) {
      whereClause += ' AND uv.name LIKE ?';
      params.push(`%${filters.name}%`);
    }
    if (filters.userId) {
      whereClause += ' AND uv.id = ?';
      params.push(filters.userId);
    }
    if (filters.groupId && filters.groupId !== 'all') {
      whereClause += ' AND uv.`group` = ?';
      params.push(filters.groupId);
    }

    const [rows] = await pool.query(`
      SELECT uv.*, g.name as group_name 
      FROM user_view uv
      LEFT JOIN \`group\` g ON uv.\`group\` = g.id
      ${whereClause}
      ORDER BY uv.id ASC
      LIMIT ? OFFSET ?
    `, [...params, parseInt(pageSize), parseInt(offset)]);

    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) as total FROM user_view uv ${whereClause}
    `, params);
    
    return { data: rows, total };
  }

  /**
   * 根据 ID 获取单个用户详细信息（含组别名称）
   */
  async getUserById(id) {
    const [rows] = await pool.query(`
      SELECT uv.*, g.name as group_name
      FROM user_view uv
      LEFT JOIN \`group\` g ON uv.\`group\` = g.id
      WHERE uv.id = ?
    `, [id]);
    return rows[0];
  }

  /**
   * 获取用户按测试类型分类的 PB (Personal Best) 记录
   * 覆盖全部 17 项专业指标，按 type_id 分组返回
   */
  async getUserPB(uid) {
    const [rows] = await pool.query(`
      SELECT 
        \`type\` AS type_id,
        MAX(con_stre_max)   AS max_con_stre_max,
        MAX(con_stre_avg)   AS max_con_stre_avg,
        MAX(ecc_stre_max)   AS max_ecc_stre_max,
        MAX(ecc_stre_avg)   AS max_ecc_stre_avg,
        MAX(con_power_max)  AS max_con_power_max,
        MAX(con_power_avg)  AS max_con_power_avg,
        MAX(ecc_power_max)  AS max_ecc_power_max,
        MAX(ecc_power_avg)  AS max_ecc_power_avg,
        MAX(con_work_max)   AS max_con_work_max,
        MAX(con_work_avg)   AS max_con_work_avg,
        MAX(ecc_work_max)   AS max_ecc_work_max,
        MAX(ecc_work_avg)   AS max_ecc_work_avg,
        MAX(con_speed_max)  AS max_con_speed_max,
        MAX(con_speed_avg)  AS max_con_speed_avg
      FROM test_record
      WHERE uid = ? AND end_time IS NOT NULL
      GROUP BY \`type\`
    `, [uid]);

    // 转换为以 type_id 为 key 的 Map，并计算相对指标（需要 weight）
    const pbMap = {};
    rows.forEach(r => { pbMap[r.type_id] = r; });
    return pbMap;
  }

  /**
   * 获取用户训练统计（总次数、分类次数、最后训练时间）
   */
  async getUserStats(uid) {
    const [[stats]] = await pool.query(`
      SELECT
        COUNT(*) AS total_count,
        SUM(\`type\` = 1) AS isokinetic_count,
        SUM(\`type\` = 2) AS isotonic_count,
        SUM(\`type\` = 3) AS isometric_count,
        MAX(begin_time)   AS last_train_time
      FROM test_record
      WHERE uid = ? AND end_time IS NOT NULL
    `, [uid]);
    return stats;
  }

  /**
   * 获取用户“个人巅峰时刻”（等速力量、等张速度、等长力量的历史最高详情）
   */
  async getUserGloryMoments(uid) {
    const [rows] = await pool.query(`
      SELECT * FROM (
        SELECT 
          id, \`type\`, begin_time as time,
          con_stre_max, con_speed_max,
          ROW_NUMBER() OVER(PARTITION BY \`type\` ORDER BY con_stre_max DESC) as rn_stre,
          ROW_NUMBER() OVER(PARTITION BY \`type\` ORDER BY con_speed_max DESC) as rn_speed
        FROM test_record
        WHERE uid = ? AND end_time IS NOT NULL
      ) t
      WHERE 
        (\`type\` = 1 AND rn_stre = 1) OR
        (\`type\` = 2 AND rn_speed = 1) OR
        (\`type\` = 3 AND rn_stre = 1)
      ORDER BY \`type\` ASC
    `, [uid]);
    
    // 规范化输出，使前端直接可用
    return rows.map(r => ({
      id: r.id,
      type: r.type,
      time: r.time,
      value: r.type === 2 ? r.con_speed_max : r.con_stre_max,
      unit: r.type === 2 ? 'mm/s' : 'kg',
      label: r.type === 1 ? '等速巅峰力量' : r.type === 2 ? '等张极限速度' : '等长绝对静力'
    }));
  }

  /**
   * 获取用户训练记录（支持分页、筛选、排序）
   */
  async getUserRecentRecords(uid, { page = 1, pageSize = 10, typeId, partId, startDate, endDate, sortBy = 'time', sortOrder = 'DESC' } = {}) {
    const offset = (page - 1) * pageSize;
    let whereClause = 'WHERE tr.uid = ? AND tr.end_time IS NOT NULL';
    const queryParams = [uid];

    // 筛选条件
    if (typeId && typeId !== 'all') {
      whereClause += ' AND tr.`type` = ?';
      queryParams.push(typeId);
    }
    if (partId && partId !== 'all') {
      whereClause += ' AND tr.part = ?';
      queryParams.push(partId);
    }
    if (startDate) {
      whereClause += ' AND tr.begin_time >= ?';
      queryParams.push(startDate);
    }
    if (endDate) {
      whereClause += ' AND tr.begin_time <= ?';
      queryParams.push(`${endDate} 23:59:59`);
    }

    // 排序逻辑 (映射前端字段到数据库字段)
    const sortFieldMap = {
      'id': 'tr.id',
      'time': 'tr.begin_time',
      'type_name': 'tt.name',
      'con_stre_max': 'tr.con_stre_max'
    };
    const orderField = sortFieldMap[sortBy] || 'tr.begin_time';
    const orderDir = sortOrder.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

    const [rows] = await pool.query(`
      SELECT 
        tr.id,
        tr.begin_time AS time,
        tr.\`type\` AS type_id,
        tr.part AS part_id,
        tr.cfg_con_speed, tr.cfg_stre, tr.cfg_pos,
        tr.cfg_group, tr.cfg_rest_time,
        tr.con_stre_max, tr.con_power_max, tr.con_speed_max,
        tt.name AS type_name,
        bp.name AS part_name
      FROM test_record tr
      LEFT JOIN test_type tt ON tr.\`type\` = tt.id
      LEFT JOIN body_part bp ON tr.part = bp.id
      ${whereClause}
      ORDER BY ${orderField} ${orderDir}
      LIMIT ? OFFSET ?
    `, [...queryParams, parseInt(pageSize), parseInt(offset)]);

    const [[{ total }]] = await pool.query(`
      SELECT COUNT(*) AS total
      FROM test_record tr
      ${whereClause}
    `, queryParams);

    return { data: rows, total };
  }

  /**
   * 获取用户指标变化趋势数据
   */
  async getUserTrendData(uid, typeId, limit = 30) {
    const [rows] = await pool.query(`
      SELECT 
        id,
        begin_time AS time,
        con_stre_max,
        con_power_max,
        con_speed_max,
        con_work_max
      FROM test_record
      WHERE uid = ? AND \`type\` = ? AND end_time IS NOT NULL
      ORDER BY begin_time ASC
      LIMIT ?
    `, [uid, parseInt(typeId), parseInt(limit)]);
    return rows;
  }
}

export default new UserModel();
