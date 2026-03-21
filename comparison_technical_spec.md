# 数字化康复对标系统：多记录对比页面 (TrainComparison) 实现技术规格书

## 1. 概述
[TrainComparison](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainComparison.jsx#55-353) 页面是 ds-platform 的核心分析组件，旨在为临床医生和康复师提供多场次、多维度的康复数据对标分析。该页面集成了高频过程曲线叠加可视化与静态效能指标矩阵，支持等速 (IsoK)、等张 (IsoT) 及等长 (IsoM) 三种核心测试模式。

## 2. 视觉设计与 UI 规范
### 2.1 配色方案 (针对深色/蓝黑背景)
为了在蓝黑底色下实现极高的辨识度，系统采用了一套**高明度霓虹/荧光色系**：
- **第一对标场次**：奶油黄 (`#f6e58d`) - 最高的明度，作为首选对标基准。
- **第二对标场次**：亮电橙 (`#FF9F43`) - 与深色背景形成强烈对比。
- **后续场次**：包括亮珊瑚红、草原绿、亮杏橙等高饱和色。

### 2.2 视觉增强技术
- **文字立体化**：所有表格表头应用了 `text-shadow: 0px 1px 3px rgba(0,0,0,0.8)`，确保文字在任何波形图背景下都能“浮现”。
- **层级区分**：卡片式布局配合半透明衬底 (`rgba(255,255,255,0.04)`)，将操作区、表格区与图表区完美隔离。

## 3. 数据处理与信号链
### 3.1 预处理流程
1. **数据抓取**：基于 URL 中的 `ids` 参数，并行聚合后端 [getDetail](file:///c:/Jonny/ds_test/ds-platform/src/services/api.js#23-25) 接口数据。
2. **信号过滤**：采用**二阶巴特沃斯低通滤波器** (Butterworth Filter)，截止频率 15Hz，采样率 1000Hz，旨在滤除运动过程中的硬件噪声与震颤干扰。
3. **数据重采样**：使用 ECharts 的 `LTTB` (Largest-Triangle-Three-Buckets) 下采样算法，在保证波形特征的前提下极大提升了多线叠加时的渲染性能。

### 3.2 模式适配逻辑
- **等速/等长 (IsoK/IsoM)**：Y 轴映射为 **力量 (kg)**，标题动态切换为“过程曲线 力量-时间图”。
- **等张 (IsoT)**：Y 轴映射为 **速度 (mm/s)**，数据执行取反处理以对齐物理运动方向，标题显示为“过程曲线 速度-时间图”。

## 4. 核心功能组件实现
### 4.1 智能对标矩阵 (Comparative Matrix)
系统根据 `type_id` 自动切换三套指标评估体系，所有指标均基于 [formatVal](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainDetail.jsx#119-124) 进行 2 位小数格式化：

#### 4.1.1 等速模式 (Isokinetic, type_id: 1)
侧重于评估关节全量程内的爆发力与向心/离心对比，采用“向心 / 离心”双值展示。
- **峰值力量 [kg]**：`con_stre_max` / `ecc_stre_max`
- **平均力量 [kg]**：`con_stre_avg` / `ecc_stre_avg`
- **峰值功率 [W]**：`con_power_max` / `ecc_power_max`
- **平均功率 [W]**：`con_power_avg` / `ecc_power_avg`
- **总做功 [J]**：`con_work_max` / `ecc_work_max`
- **相对峰值力量 [kg/kg]**：[(con_stre_max / weight)](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainDetail.jsx#130-131) / [(ecc_stre_max / weight)](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainDetail.jsx#130-131)
- **相对峰值功率 [W/kg]**：[(con_power_max / weight)](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainDetail.jsx#130-131) / [(ecc_power_max / weight)](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainDetail.jsx#130-131)
- **相对做功效率 [J/kg]**：[(con_work_max / weight)](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainDetail.jsx#130-131) / [(ecc_work_max / weight)](file:///c:/Jonny/ds_test/ds-platform/src/pages/TrainDetail.jsx#130-131)

#### 4.1.2 等张模式 (Isotonic, type_id: 2)
侧重于恒定阻力下的极限收缩速率评估。
- **最大速度 [mm/s]**：`con_speed_max`
- **平均速度 [mm/s]**：`con_speed_avg`
- **最大功率 [W]**：`con_power_max`
- **平均功率 [W]**：`con_power_avg`
- **相对最大功率 [W/kg]**：`con_power_max / weight`

#### 4.1.3 等长模式 (Isometric, type_id: 3)
侧重于固定关节角度下的静力绝对力量与稳定性评估。
- **最大力量 [kg]**：`con_stre_max`
- **平均力量 [kg]**：`con_stre_avg`
- **相对最大力量 [kg/kg]**：`con_stre_max / weight`
- **相对平均力量 [kg/kg]**：`con_stre_avg / weight`

### 4.2 ECharts 专业图表集成
- **坐标轴优化**：X 轴展示为“时间 (ms)”，移除了刻度上的冗余单位。轴标题和刻度文字均采用高对比度纯白设计。
- **动态交互**：集成了 `dataZoom` 内部缩放功能，支持通过鼠标滚轮局部放大波形。

## 5. 场次标识规范
所有对标标识统一遵循：**“测试 [ID] ([受试者姓名])”**。
- 例如：`测试684(王娟)`。

## 6. 异常与边界处理
- **数据容错**：当某个场次数据缺失或计算公式涉及变量为空时，系统统一显示 为 `--`。
- **安全边界**：扩大了图表的底部与右侧 Grid 边距，确保轴标题在深色容器中完整可见。
