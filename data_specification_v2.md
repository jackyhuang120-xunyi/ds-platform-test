# 数字化运动康复训练：指标定义与计算规范 (1:1 源码对齐版)

本规范文档严格基于 [TrainDetail.jsx](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainDetail.jsx) 渲染逻辑编写，详细说明各测试模式下的所有可见数据项及其计算来源。

---

## 1. 评估模式与图表规范

| 测试模式 | type_id | 过程曲线 (Y 轴) | 数据特征 |
| :--- | :--- | :--- | :--- |
| **等速 (Isokinetic)** | 1 | **力量 (kg)** | 评估关节全量程内的爆发力与向心/离心对比。 |
| **等张 (Isotonic)** | 2 | **速度 (mm/s)** | 评估恒定阻力下的极限收缩速率（速度值取反）。 |
| **等长 (Isometric)** | 3 | **力量 (kg)** | 评估固定关节角度下的静力绝对力量。 |

---

## 2. 详细指标定义表

### 2.1 等速测试指标 (Isokinetic Metrics)
等速模式报表采用 **6 行 × 4 列** 矩阵结构。

| 指标项目 (Row) | 计算/来源逻辑 (Col 1-4) | 备注 |
| :--- | :--- | :--- |
| **峰值力量 (kg)** | `con_stre_max`, `con_stre_avg`, `ecc_stre_max`, `ecc_stre_avg` | 数据库原始字段 |
| **峰值功率 (W)** | `con_power_max`, `con_power_avg`, `ecc_power_max`, `ecc_power_avg` | 数据库原始字段 |
| **做功 (J)** | `con_work_max`, `con_work_avg`, `ecc_work_max`, `ecc_work_avg` | 数据库原始字段 |
| **相对峰值力量** | `con_stre_max / weight`, `con_stre_avg / weight`, `ecc_stre_max / weight`, `ecc_stre_avg / weight` | 归一化力量密度 |
| **相对峰值功率 (W/kg)** | `con_power_max / weight`, `con_power_avg / weight`, `ecc_power_max / weight`, `ecc_power_avg / weight` | 归一化功率输出 |
| **相对做功 (J/kg)** | `con_work_max / weight`, `con_work_avg / weight`, `ecc_work_max / weight`, `ecc_work_avg / weight` | 归一化能量效率 |

---

### 2.2 等张测试指标 (Isotonic Metrics)
等张模式侧重于在单一受阻量下的动力学指标。

| 指标项目 | 计算/来源逻辑 | 说明 |
| :--- | :--- | :--- |
| **最大速度 (mm/s)** | `con_speed_max` | 数据库原始字段 |
| **平均速度 (mm/s)** | `con_speed_avg` | 数据库原始字段 |
| **最大功率 (W)** | `con_power_max` | 数据库原始字段 |
| **平均功率 (W)** | `con_power_avg` | 数据库原始字段 |
| **相对最大功率 (W/kg)** | `con_power_max / weight` | 核心爆发力评价指标 |

---

### 2.3 等长测试指标 (Isometric Metrics)
等长模式侧重于固定角度下的静力评价。

| 指标项目 | 计算/来源逻辑 | 说明 |
| :--- | :--- | :--- |
| **最大力量 (kg)** | `con_stre_max` | 数据库原始字段 |
| **平均力量 (kg)** | `con_stre_avg` | 数据库原始字段 |
| **相对最大力量** | `con_stre_max / weight` | 静态发力密度 |
| **相对平均力量** | `con_stre_avg / weight` | 静态稳定性评价指标 |

---

## 3. 预处理与异常规范

### 3.1 信号处理 (Signal Processing)
*   **滤波算法**：二阶巴特沃斯低通滤波器（Zero-phase 正反双向）。
*   **配置**：采样率 1000Hz，截止频率 15Hz。
*   **处理阶段**：加载原始 CSV 采样点后即时处理，直接用于渲染及指标展示。

### 3.2 异常逻辑
*   **零/空值处理**：若物理量不存在或涉及体重的计算变量无效，统一显示为 `--`。
*   **精度**：UI 前端显示统一遵循 `toFixed(2)` 保留 **2 位小数**。库。
