import userService from '../services/userService.js';
import trainService from '../services/trainService.js';
import groupService from '../services/groupService.js';
import pool from '../config/db.js';
import path from 'path';

class SyncController {
  /**
   * POST /api/sync/training_data
   * multipart/form-data，包含三个 Part：
   *   - user_info  : JSON字符串，用户特征信息（name + birthday 为唯一指纹）
   *   - record_info: JSON字符串，训练配置与结果数据
   *   - raw_data   : CSV 文件（二进制流）
   */
  async syncTrainingData(req, res) {
    console.log(`[SYNC] 收到合包上传请求，body keys:`, Object.keys(req.body || {}));
    if (req.file) {
      console.log(`[SYNC] 收到文件: ${req.file.filename}`);
    }

    // ── 阶段 1：解析 user_info ──────────────────────────────────────
    if (!req.body || !req.body.user_info) {
      return res.status(400).json({ success: false, message: 'Missing user_info' });
    }

    let userInfo;
    try {
      userInfo = JSON.parse(req.body.user_info);
      // 自动清洗：把值为空字符串的字段直接去掉
      for (const key in userInfo) {
        if (userInfo[key] === "") {
          delete userInfo[key];
        }
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid JSON in user_info' });
    }

    if (!userInfo.name || !userInfo.birthday) {
      return res.status(400).json({
        success: false,
        message: 'user_info 中 name 和 birthday 为必填项（用于身份指纹匹配）'
      });
    }

    // ── 阶段 1.5：自动将中文文本映射为数据库整数 ID ────────────────
    // 平板端可能传 gender="男" 而非 gender=1，此处自动转换
    if (userInfo.gender && typeof userInfo.gender === 'string' && isNaN(userInfo.gender)) {
      try {
        const [gRows] = await pool.query('SELECT id FROM gender WHERE name = ? LIMIT 1', [userInfo.gender]);
        userInfo.gender = gRows.length > 0 ? gRows[0].id : null;
        console.log(`[SYNC] gender 文本映射: "${userInfo.gender}" → ${userInfo.gender}`);
      } catch (e) {
        console.warn(`[SYNC] gender 映射失败，置空:`, e.message);
        userInfo.gender = null;
      }
    }

    // 平板端可能传 group="测试组" 而非 group=1，此处自动转换，遇到未知组别则自动创建
    if (userInfo.group && typeof userInfo.group === 'string' && isNaN(userInfo.group)) {
      try {
        const groupId = await groupService.findOrCreate(userInfo.group);
        console.log(`[SYNC] group 文本映射: "${userInfo.group}" → ${groupId}`);
        userInfo.group = groupId;
      } catch (e) {
        console.warn(`[SYNC] group 映射/创建失败，置空:`, e.message);
        userInfo.group = null;
      }
    }

    // ── 阶段 2：解析 record_info ────────────────────────────────────
    if (!req.body.record_info) {
      return res.status(400).json({ success: false, message: 'Missing record_info' });
    }

    let recordInfo;
    try {
      recordInfo = JSON.parse(req.body.record_info);
      // 自动清洗：把值为空字符串的字段直接去掉
      for (const key in recordInfo) {
        if (recordInfo[key] === "") {
          delete recordInfo[key];
        }
      }
    } catch (e) {
      return res.status(400).json({ success: false, message: 'Invalid JSON in record_info' });
    }

    if (!recordInfo.begin_time) {
      return res.status(400).json({
        success: false,
        message: 'record_info 中 begin_time 为必填项'
      });
    }

    try {
      // ── 阶段 3：用户幂等查找/创建 ──────────────────────────────────
      // 以 name + birthday 为指纹：存在则复用，不存在则自动注册
      const userResult = await userService.idempotentCreate(userInfo);
      const uid = userResult.id;

      if (userResult.isNew) {
        console.log(`[SYNC] 新用户已注册: ${userInfo.name}, uid=${uid}`);
      } else {
        console.log(`[SYNC] 命中已有用户: ${userInfo.name}, uid=${uid}`);
      }

      // ── 阶段 4：构建训练记录，注入 uid，并过滤白名单字段 ──────────
      // test_record 表允许写入的字段白名单（防止平板传入未知字段导致SQL报错）
      const ALLOWED_RECORD_FIELDS = new Set([
        'uid', 'type', 'part',
        'cfg_roma', 'cfg_romb', 'cfg_stre', 'cfg_con_speed', 'cfg_ecc_speed',
        'cfg_pos', 'cfg_group', 'cfg_rest_time',
        'con_stre_max', 'con_stre_avg', 'con_speed_max', 'con_speed_avg',
        'con_power_max', 'con_power_avg', 'con_work_max', 'con_work_avg',
        'ecc_stre_max', 'ecc_stre_avg', 'ecc_speed_max', 'ecc_speed_avg',
        'ecc_power_max', 'ecc_power_avg', 'ecc_work_max', 'ecc_work_avg',
        'result', 'begin_time', 'end_time', 'log', 'video'
      ]);

      const recordData = { uid }; // uid 由服务端注入，优先级最高
      for (const [key, value] of Object.entries(recordInfo)) {
        if (key !== 'uid' && ALLOWED_RECORD_FIELDS.has(key)) {
          recordData[key] = value;
        }
      }

      // ── 阶段 5：计算 CSV 存储路径 ──────────────────────────────────
      let logPath = null;
      if (req.file) {
        const dateStr = recordData.begin_time
          ? recordData.begin_time.split(' ')[0]
          : new Date().toISOString().split('T')[0];
        logPath = `./log/${dateStr}/${req.file.filename}`;
      }

      // ── 阶段 6：训练记录幂等写入 ───────────────────────────────────
      // 以 uid + begin_time 为去重键：已有则跳过，首次则入库
      const trainResult = await trainService.createUploadRecord(recordData, logPath);

      if (trainResult.isDuplicate) {
        return res.status(200).json({
          success: true,
          message: '训练记录已存在（幂等命中）',
          record_id: trainResult.id,
          uid,
          isDuplicate: true
        });
      }

      // ── 成功 ────────────────────────────────────────────────────────
      return res.status(201).json({
        success: true,
        message: '同步成功',
        record_id: trainResult.id,
        uid,
        isNewUser: userResult.isNew,
        isDuplicate: false
      });

    } catch (error) {
      console.error(`[SYNC] 合包上传失败: ${error.message}`);
      return res.status(500).json({ success: false, message: error.message });
    }
  }
}

export default new SyncController();
