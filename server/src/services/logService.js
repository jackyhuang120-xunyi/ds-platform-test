import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * 解决数据库 log 字段与物理路径偏差的工具服务
 */
class LogService {
  constructor() {
    // 日志根目录实际位于 ds-platform/log
    // 当前文件在 server/src/services/logService.js
    // 路径转换: ../../../log
    this.baseLogPath = path.resolve(__dirname, '../../../log');
  }

  /**
   * 将数据库中的相对路径转为绝对路径
   * 示例: ./log/2024-02-21/23-08-55.csv -> c:\Jonny\ds_test\ds-platform\log\2024-02-21\23-08-55.csv
   */
  resolvePath(dbPath) {
    if (!dbPath) return null;
    // 移除开头的 ./log/ 获取日期和文件名部分
    const relativePart = dbPath.replace(/^\.\/log\//, '');
    const absolutePath = path.join(this.baseLogPath, relativePart);
    return absolutePath;
  }

  /**
   * 读取并解析 1000Hz CSV 数据
   */
  async readLogData(dbPath) {
    const absolutePath = this.resolvePath(dbPath);
    try {
      const content = await fs.readFile(absolutePath, 'utf-8');
      const lines = content.split('\n').filter(line => line.trim() !== '');
      
      // 这里的解析逻辑视 CSV 具体格式而定
      // 假设第一行是标题，后续是数据
      return lines.map(line => line.split(','));
    } catch (error) {
      console.error(`[LogService] 无法读取日志文件: ${absolutePath}`, error.message);
      return null;
    }
  }
}

export default new LogService();
