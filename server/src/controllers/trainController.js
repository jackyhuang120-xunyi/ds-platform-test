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
}

export default new TrainController();
