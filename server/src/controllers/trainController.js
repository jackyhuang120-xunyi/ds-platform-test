import trainService from '../services/trainService.js';

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
    try {
      if (!req.body.record_data) {
        return res.status(400).json({ success: false, message: 'Missing record_data' });
      }

      let recordData;
      try {
        recordData = JSON.parse(req.body.record_data);
      } catch (e) {
        return res.status(400).json({ success: false, message: 'Invalid JSON in record_data' });
      }

      let logPath = null;
      if (req.file) {
        const today = new Date();
        const dateStr = today.getFullYear() + '-' + String(today.getMonth()+1).padStart(2,'0') + '-' + String(today.getDate()).padStart(2,'0');
        logPath = `./log/${dateStr}/${req.file.filename}`;
      }

      const insertId = await trainService.createUploadRecord(recordData, logPath);
      res.status(200).json({ success: true, message: 'Upload success', id: insertId });
    } catch (error) {
      console.error(`[DEBUG] uploadRecord Error: ${error.message}`);
      res.status(500).json({ success: false, error: error.message });
    }
  }
}

export default new TrainController();
