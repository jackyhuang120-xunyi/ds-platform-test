import trainModel from '../models/trainModel.js';
import logService from './logService.js';

class TrainService {
  async listRecords(filters) {
    const { page = 1, pageSize = 12, ...otherFilters } = filters;
    return await trainModel.getTrainRecords(otherFilters, page, pageSize);
  }

  async getDeepAnalysis(id) {
    const record = await trainModel.getRecordDetail(id);
    if (!record) return null;

    // 如果存有日志路径，则读取 1000Hz 数据
    let rawData = [];
    if (record.log) {
      rawData = await logService.readLogData(record.log);
    }

    return {
      summary: record,
      chartData: rawData
    };
  }

  async getRanking(params) {
    const { typeId, metric, limit = 50 } = params;
    return await trainModel.getRankingData(typeId, metric, limit);
  }
}

export default new TrainService();
