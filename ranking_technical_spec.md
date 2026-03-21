# 📊 排行榜系统（Ranking System）技术规格说明书

## 1. 系统概述
排行榜系统旨在对受试者的“评估测试”数据进行深度聚合与多维度呈现。系统通过接入 `test_record` 物理表，利用高性能 SQL 逻辑实现“一人一席”的最佳成绩展示，为康复评估提供直观的竞争参考。

---

## 2. 核心排序逻辑 (Sorting Logic)

### 2.1 聚合策略：一人一席 (Unique Per User)
为了避免同一受试者通过多次测试刷榜，系统采用了严格的去重聚合策略：
*   **分组维度**：仅以 `userId` (uid) 为唯一分组标识。
*   **最优选择**：在受试者的所有历史记录中，通过窗口函数精准提取该指标下的 **最高分记录**。

### 2.2 SQL 实现细节 (Window Function)
系统采用 MySQL 8.0 的 **CTE (Common Table Expressions)** 与 **窗口函数** 确保数据的一致性：
```sql
WITH RankedRecords AS (
  SELECT 
    tr.id AS recordId,
    tr.uid AS userId,
    [指标计算公式] AS score,
    [物理配置字段],
    ROW_NUMBER() OVER (
      PARTITION BY tr.uid 
      ORDER BY [score] DESC, tr.id DESC
    ) as rn
  FROM test_record tr
  JOIN user u ON tr.uid = u.id
)
SELECT * FROM RankedRecords WHERE rn = 1
ORDER BY score DESC;
```
> [!IMPORTANT]
> 通过 `ROW_NUMBER() OVER(PARTITION BY tr.uid ...)` 逻辑，系统确保了 `recordId`、`score` 及测试时的物理参数（角度、速度、部位）在逻辑上是**绝对闭环**的，解决了以往聚合查询中 ID 与数值不匹配的偏差问题。

---

## 3. 指标体系与计算规范 (Metrics & Calculation)

系统支持三大测试模式共 17 项专业评估指标，计算逻辑分为两类：

### 3.1 物理原始指标
直接从数据库字段提取，取值单位遵循国际康复标准。
*   **向心系列** (Concentric): `con_stre_max`, `con_stre_avg`, `con_power_max`, `con_work_max`
*   **离心系列** (Eccentric): `ecc_stre_max`, `ecc_power_max` 等。

### 3.2 动态相对指标 (Relative Intensity)
基于受试者体重的归一化计算，反映发力密度，是临床评估的核心。
*   **计算公式**：`RawValue / NULLIF(u.weight, 0)`
*   **输出单位**：kg/kg, W/kg, J/kg。

---

## 4. UI/UX 语义化设计

### 4.1 领奖台席位 (Podium Display)
*   **冠军 (Champion)**：居中 C 位，高度最高，辅以 `Trophy` 金色图标。
*   **亚军 / 季军**：分布左右，采用阶梯落差。
*   **交互逻辑**：点击立柱直接通过 `recordId` 跳转至对应的 `TrainDetail`。

### 4.2 视觉语义映射
针对康复场景，引入了方向性图标适配逻辑：
| 测试部位内容 | 图标类型 | 颜色标识 | 语义含义 |
| :--- | :--- | :--- | :--- |
| **左腿** | `ArrowLeftToLine` | #fb923c (暖橙) | 边界左侧发力感 |
| **右腿** | `ArrowRightToLine` | #4ade80 (翠绿) | 边界右侧动力感 |
| **双腿** | `Columns` | #60a5fa (天蓝) | 对称平衡联动 |

---

## 5. 前后端对接规范
*   **接口地址**：`GET /api/trains/ranking`
*   **请求参数**：
    *   `typeId`: 模式 ID (1-等速, 2-等张, 3-等长)
    *   `metric`: 排序指标列名（系统自动转换相对/物理逻辑）
    *   `limit`: 返回排名的深度（默认 Top 50）
*   **数据精度**：全链路保留 **2位小数** (`toFixed(2)`)，以确保排行榜与详情页数值展示完全对齐。
