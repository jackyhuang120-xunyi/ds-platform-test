import trainService from '../services/trainService.js';
import userService from '../services/userService.js';

class TrainController {
  async getRecords(req, res) {
    try {
      const records = await trainService.listRecords(req.query);
      if (records.data && records.data.length > 0) {
        console.log(`[DEBUG] getRecords - First record raw:`, JSON.stringify(records.data[0]));
      }
      console.log(`[DEBUG] getRecords - Found: ${records.data.length} records, Total: ${records.total}`);
      res.json(records);
    } catch (error) {
      console.error(`[DEBUG] getRecords Error: ${error.message}`);
      res.status(500).json({ error: error.message });
    }
  }

  async getDetail(req, res) {
    try {
      const { id } = req.params;
      const data = await trainService.getDeepAnalysis(id);
      if (!data) return res.status(404).json({ message: '记录不存在' });
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async getRanking(req, res) {
    try {
      const data = await trainService.getRanking(req.query);
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }

  async uploadRecord(req, res) {
    console.log(`[DEBUG] uploadRecord - Received request, body keys:`, Object.keys(req.body || {}));
    if (req.file) {
      console.log(`[DEBUG] uploadRecord - Received file:`, req.file.filename);
    }
    try {
      if (!req.body || !req.body.record_data) {
        return res.status(400).json({ success: false, message: 'Missing record_data' });
      }

      let recordData;
      try {
        recordData = JSON.parse(req.body.record_data);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid JSON in record_data' });
      }

      // --- 阶段 1：用户有效性校验 ---
      const user = await userService.getUserProfile(recordData.uid);
      if (!user) {
        return res.status(404).json({ success: false, message: '上传失败：目标用户 ID 不存在' });
      }

      let logPath = null;
      if (req.file) {
        let dateStr;
        if (recordData.begin_time) {
          dateStr = recordData.begin_time.split(' ')[0];
        } else {
          const today = new Date();
          dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        }
        logPath = `./log/${dateStr}/${req.file.filename}`;
      }

      // --- 阶段 2 & 3：记录排重 (幂等) 与存盘入库 ---
      const result = await trainService.createUploadRecord(recordData, logPath);
      
      if (result.isDuplicate) {
        // 幂等命中：告知同步引擎“我已经有了，你可以删掉本地任务了”
        return res.status(200).json({ 
          success: true, 
          message: '记录已存在', 
          id: result.id,
          isDuplicate: true 
        });
      }

      // 首次物理录入成功
      res.status(201).json({ success: true, message: '记录上传成功', id: result.id });
    } catch (error) {
      console.error(`[DEBUG] uploadRecord Error: ${error.message}`);
      res.status(500).json({ success: false, status: 'error', message: error.message });
    }
  }
}

export default new TrainController();
