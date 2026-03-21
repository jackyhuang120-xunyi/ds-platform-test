import React, { useState, useEffect, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import ReactECharts from 'echarts-for-react';
import { Columns, GitCompare, ChevronLeft, User, Activity, Info } from 'lucide-react';
import { trainApi } from '../services/api';

// ============================================================================
// 专业滤波器实现：二阶巴特沃斯低通滤波器 (Butterworth Filter)
// ============================================================================
const butterworthFilter = (data, cutoff = 15, sampleRate = 1000) => {
  // ... (保持现有逻辑)
  if (!data || data.length < 5) return data;
  const n = data.length;
  const simplifiedData = data.map(v => v || 0);
  const output = new Array(n).fill(0);
  const fr = sampleRate / cutoff;
  const ohm = Math.tan(Math.PI / fr);
  const c = 1.0 + 2.0 * Math.cos(Math.PI / 4.0) * ohm + ohm * ohm;
  const b0 = (ohm * ohm) / c;
  const b1 = 2.0 * b0;
  const b2 = b0;
  const a1 = 2.0 * (ohm * ohm - 1.0) / c;
  const a2 = (1.0 - 2.0 * Math.cos(Math.PI / 4.0) * ohm + ohm * ohm) / c;
  output[0] = simplifiedData[0];
  output[1] = simplifiedData[1];
  for (let i = 2; i < n; i++) {
    output[i] = b0 * simplifiedData[i] + b1 * simplifiedData[i-1] + b2 * simplifiedData[i-2] 
              - a1 * output[i-1] - a2 * output[i-2];
  }
  const finalOutput = new Array(n).fill(0);
  finalOutput[n-1] = output[n-1];
  finalOutput[n-2] = output[n-2];
  for (let i = n - 3; i >= 0; i--) {
    finalOutput[i] = b0 * output[i] + b1 * output[i+1] + b2 * output[i+2]
                   - a1 * finalOutput[i+1] - a2 * finalOutput[i+2];
  }
  return finalOutput;
};

// ============================================================================
// 通用格式化工具：支持数值与文本的智能转换 (修复作用域 ReferenceError)
// ============================================================================
const formatVal = (val, isNumeric = false) => {
  if (val === null || val === undefined || val === '') return '--';
  
  // 只有在明确要求是数字或者是数值类型时，才尝试进行 Fixed(2) 处理
  if (isNumeric || typeof val === 'number') {
    const num = parseFloat(val);
    if (isNaN(num)) return val; // 如果转换数字失败，则回退到原始字符串
    return num.toFixed(2);
  }
  return val;
};

const TrainComparison = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [compareRecords, setCompareRecords] = useState([]);
  const [chartSource, setChartSource] = useState({ series: [], timeline: [] });
  const [typeInfo, setTypeInfo] = useState({ id: 1, name: '等速测试' });

  // 极高对比度配色方案：针对蓝黑背景专门筛选的高明度颜色，确保文字与曲线绝对清晰
  const colors = [
    '#f6e58d', // 奶油黄 (高亮)
    '#FF9F43', // 亮电橙 (替换极光青，增强对比)
    '#ff7979', // 亮珊瑚红
    '#badc58', // 草原绿
    '#ffbe76', // 亮杏橙
    '#ffffff', // 纯白 (极致对比)
    '#D6A2E8'  // 亮熏衣草 (仅作为后备)
  ];

  useEffect(() => {
    const fetchCompareData = async () => {
      try {
        const query = new URLSearchParams(location.search);
        const ids = query.get('ids')?.split(',') || [];
        if (ids.length === 0) return;

        const details = await Promise.all(ids.map(id => trainApi.getDetail(id)));
        const validDetails = details.filter(d => d && d.summary);

        if (validDetails.length > 0) {
          const firstType = validDetails[0].summary.type_id;
          setTypeInfo({ 
            id: firstType, 
            name: validDetails[0].summary.type_name 
          });

          setCompareRecords(validDetails.map(d => ({
            ...d.summary,
            weight: d.summary.weight || 1
          })));

          const isIsoT = firstType === 2;
          
          // 对齐单页详情逻辑，处理二维 CSV 数组
          const allSeries = validDetails.map((v, idx) => {
            const chartDataRaw = v.chartData || [];
            if (chartDataRaw.length < 2) return null;

            // 1. 解析表头
            const headers = chartDataRaw[0].map(h => h.trim());
            const rows = chartDataRaw.slice(1);

            // 2. 找到关键列索引 (力量用 Force, 速度用 speed)
            const targetHeader = isIsoT ? 'speed' : 'Force';
            const colIndex = headers.indexOf(targetHeader);
            
            if (colIndex === -1) {
              return null;
            }

            // 3. 提取列数据并转换为数值
            const values = rows.map(row => {
              const val = parseFloat(row[colIndex]);
              return isNaN(val) ? 0 : val;
            });

            // 4. 应用巴特沃斯滤波
            const filtered = butterworthFilter(values, 15, 1000);
            
            return {
              name: `测试${v.summary.id}(${v.summary.user_name})`,
              type: 'line',
              smooth: true,
              showSymbol: false,
              sampling: 'lttb',
              data: filtered.map(val => Number((isIsoT ? -val : val).toFixed(2))),
              lineStyle: { width: 2.5 },
              color: colors[idx % colors.length]
            };
          }).filter(Boolean);

          const maxLen = Math.max(...allSeries.map(s => s.data.length), 0);
          // 统一时间轴轴序列 (移除刻度上的单位，优化性能)
          const timeline = Array.from({ length: maxLen }, (_, i) => i);

          setChartSource({ series: allSeries, timeline });
        }
      } catch (err) {
        console.error('对比数据加载失败:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchCompareData();
  }, [location.search]);

  // ECharts 配置项生成
  const getOption = useMemo(() => {
    return {
      backgroundColor: 'transparent',
      tooltip: {
        trigger: 'axis',
        backgroundColor: 'rgba(28, 28, 30, 0.95)',
        borderColor: 'rgba(255, 255, 255, 0.1)',
        textStyle: { color: '#fff' },
        axisPointer: { type: 'cross', label: { backgroundColor: '#6a7985' } }
      },
      legend: {
        data: chartSource.series.map(s => s.name),
        textStyle: { 
          color: '#ffffff', 
          fontSize: 14,
          fontWeight: '600'
        },
        top: 0
      },
      grid: {
        left: '4%',
        right: '8%', // 增大右侧间距，为 X 轴单位腾出空间
        bottom: '12%', // 增大底部间距
        top: '60px',
        containLabel: true
      },
      xAxis: {
        type: 'category',
        data: chartSource.timeline,
        name: '时间 (ms)',
        nameLocation: 'end', // 确保标题在轴末端
        nameGap: 15, // 标题与轴线的间距
        nameTextStyle: { color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'bold' },
        axisPointer: { show: true },
        splitLine: { show: false },
        axisLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.4)', width: 2 } },
        axisLabel: { 
          color: '#ffffff',
          fontWeight: '500',
          interval: 'auto',
          hideOverlap: true,
          margin: 12 // 增加刻度文字与轴线的距离
        }
      },
      yAxis: {
        type: 'value',
        name: typeInfo.id === 2 ? '速度 (mm/s)' : '力量 (kg)',
        nameTextStyle: { color: 'rgba(255, 255, 255, 0.8)', fontWeight: 'bold' },
        splitLine: { lineStyle: { color: 'rgba(255, 255, 255, 0.1)' } },
        axisLine: { show: true, lineStyle: { color: 'rgba(255, 255, 255, 0.4)', width: 2 } },
        axisLabel: { color: '#ffffff', fontWeight: '500' }
      },
      series: chartSource.series,
      dataZoom: [ // 虽然不需要进度条，但增加滑轮缩放功能非常利于波形对标
        { type: 'inside', start: 0, end: 100 }
      ]
    };
  }, [chartSource, typeInfo]);

  if (loading) return <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>正在聚合多维分析数据...</div>;

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out', maxWidth: '1440px', margin: '0 auto', padding: '24px' }}>
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button onClick={() => window.history.back()} className="btn-sm" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', border: '1px solid rgba(255,255,255,0.1)', padding: '10px', borderRadius: '12px', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
          <ChevronLeft size={20} />
        </button>
        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700' }}>效能对标 (ECharts 专业版) - {typeInfo.name}</h2>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '24px', marginBottom: '32px' }}>
        {/* 1. 基本体征对比 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <User size={20} color="#30d158" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>基本体征对标</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={thStyle}>参数</th>
                {compareRecords.map((r, i) => (
                  <th key={r.id} style={{ ...thStyle, color: colors[i % colors.length] }}>测试{r.id}({r.user_name})</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="姓名" field="user_name" records={compareRecords} />
              <CompareRow label="性别" field="gender_name" records={compareRecords} />
              <CompareRow label="年龄 (岁)" field="age" records={compareRecords} />
              <CompareRow label="身高 (cm)" field="height" records={compareRecords} />
              <CompareRow label="体重 (kg)" field="weight" records={compareRecords} />
              <CompareRow label="测试部位" field="part_name" records={compareRecords} />
            </tbody>
          </table>
        </div>

        {/* 2. 训练配置对比 */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
            <Activity size={20} color="#007aff" />
            <h3 style={{ margin: 0, fontSize: '18px' }}>算法配置对标</h3>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                <th style={thStyle}>参数</th>
                {compareRecords.map((r, i) => (
                  <th key={r.id} style={{ ...thStyle, color: colors[i % colors.length] }}>测试{r.id}({r.user_name})</th>
                ))}
              </tr>
            </thead>
            <tbody>
              <CompareRow label="训练组数" field="cfg_group" records={compareRecords} postfix=" 组" />
              <CompareRow label="休息时间" field="cfg_rest_time" records={compareRecords} postfix=" s" />
              {typeInfo.id === 1 && <CompareRow label="设定速度" field="cfg_con_speed" records={compareRecords} postfix=" mm/s" />}
              {typeInfo.id === 2 && <CompareRow label="设定阻力" field="cfg_stre" records={compareRecords} postfix=" kg" />}
              {typeInfo.id === 3 && <CompareRow label="设定位置" field="cfg_pos" records={compareRecords} postfix=" mm" />}
              <CompareRow label="有效范围" calc={r => `${r.cfg_roma || 0}-${r.cfg_romb || 0}`} records={compareRecords} postfix=" mm" />
            </tbody>
          </table>
        </div>
      </div>

      {/* 3. 深度指标对比 */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <Columns size={20} color="#ff9f0a" />
          <h3 style={{ margin: 0, fontSize: '18px' }}>核心效能指标矩阵</h3>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: 'rgba(255,255,255,0.02)', textAlign: 'left' }}>
              <th style={thStyle}>性能维度</th>
              {compareRecords.map((r, i) => (
                <th key={r.id} style={{ ...thStyle, color: colors[i % colors.length], minWidth: '120px' }}>
                  测试{r.id}({r.user_name}) <br/>
                  <span style={{ fontSize: '11px', opacity: 0.5 }}>{r.begin_time?.substring(5, 16).replace('T', ' ')}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* 1. 等速 (Isokinetic) 专有指标矩阵 */}
            {typeInfo.id === 1 && (
              <>
                <CompareRow label="峰值力量 (向心/离心 kg)" calc={r => `${formatVal(r.con_stre_max)} / ${formatVal(r.ecc_stre_max)}`} records={compareRecords} />
                <CompareRow label="平均力量 (向心/离心 kg)" calc={r => `${formatVal(r.con_stre_avg)} / ${formatVal(r.ecc_stre_avg)}`} records={compareRecords} />
                <CompareRow label="峰值功率 (向心/离心 W)" calc={r => `${formatVal(r.con_power_max)} / ${formatVal(r.ecc_power_max)}`} records={compareRecords} />
                <CompareRow label="平均功率 (向心/离心 W)" calc={r => `${formatVal(r.con_power_avg)} / ${formatVal(r.ecc_power_avg)}`} records={compareRecords} />
                <CompareRow label="总做功 (向心/离心 J)" calc={r => `${formatVal(r.con_work_max)} / ${formatVal(r.ecc_work_max)}`} records={compareRecords} />
                <CompareRow label="相对峰值力量 (kg/kg)" calc={r => `${formatVal(r.con_stre_max/r.weight)} / ${formatVal(r.ecc_stre_max/r.weight)}`} records={compareRecords} />
                <CompareRow label="相对峰值功率 (W/kg)" calc={r => `${formatVal(r.con_power_max/r.weight)} / ${formatVal(r.ecc_power_max/r.weight)}`} records={compareRecords} />
                <CompareRow label="相对做功效率 (J/kg)" calc={r => `${formatVal(r.con_work_max/r.weight)} / ${formatVal(r.ecc_work_max/r.weight)}`} records={compareRecords} />
              </>
            )}

            {/* 2. 等张 (Isotonic) 专有指标矩阵 */}
            {typeInfo.id === 2 && (
              <>
                <CompareRow label="最大速度 (mm/s)" field="con_speed_max" records={compareRecords} isNumeric />
                <CompareRow label="平均速度 (mm/s)" field="con_speed_avg" records={compareRecords} isNumeric />
                <CompareRow label="最大功率 (W)" field="con_power_max" records={compareRecords} isNumeric />
                <CompareRow label="平均功率 (W)" field="con_power_avg" records={compareRecords} isNumeric />
                <CompareRow label="相对最大功率 (W/kg)" calc={r => r.con_power_max / r.weight} records={compareRecords} isNumeric />
              </>
            )}

            {/* 3. 等长 (Isometric) 专有指标矩阵 */}
            {typeInfo.id === 3 && (
              <>
                <CompareRow label="最大力量 (kg)" field="con_stre_max" records={compareRecords} isNumeric />
                <CompareRow label="平均力量 (kg)" field="con_stre_avg" records={compareRecords} isNumeric />
                <CompareRow label="相对最大力量" calc={r => r.con_stre_max / r.weight} records={compareRecords} isNumeric />
                <CompareRow label="相对平均力量" calc={r => r.con_stre_avg / r.weight} records={compareRecords} isNumeric />
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* 4. ECharts 曲线 */}
      <div className="card" style={{ padding: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
          <GitCompare size={24} color="var(--primary-color)" />
          <h3 style={{ margin: 0 }}>过程曲线 {typeInfo.id === 2 ? '速度-时间图' : '力量-时间图'}</h3>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', marginLeft: '12px', border: '1px solid rgba(255,255,255,0.1)', padding: '4px 12px', borderRadius: '100px' }}>
            高频原始采样 | 处理引擎: ECharts
          </span>
        </div>

        <div style={{ width: '100%', height: '560px' }}>
          <ReactECharts 
            option={getOption} 
            style={{ height: '100%', width: '100%' }}
            notMerge={true}
          />
        </div>
      </div>
    </div>
  );
};

// 后置子组件
const CompareRow = ({ label, field, calc, records, postfix = '', isNumeric = false }) => {
  return (
    <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.03)' }}>
      <td style={{ padding: '14px 16px', color: 'var(--text-muted)', fontSize: '14px', fontWeight: '500' }}>{label}</td>
      {records.map((r) => {
        const val = calc ? calc(r) : r[field];
        return (
          <td key={r.id} style={{ padding: '14px 16px', fontWeight: '600', fontSize: '15px' }}>
            {formatVal(val, isNumeric)}{val !== null && val !== undefined && val !== '' ? postfix : ''}
          </td>
        );
      })}
    </tr>
  );
};

const thStyle = {
  padding: '16px',
  borderBottom: '1px solid rgba(255,255,255,0.12)',
  fontSize: '14px',
  color: '#ffffff',
  fontWeight: '700',
  backgroundColor: 'rgba(255,255,255,0.04)',
  whiteSpace: 'nowrap',
  textShadow: '0px 1px 3px rgba(0,0,0,0.8)' // 增加文字阴影，防止被深色背景吞没
};

export default TrainComparison;
