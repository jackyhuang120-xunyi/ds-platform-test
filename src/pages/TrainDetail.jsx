import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Brush, Legend
} from 'recharts';
import { Activity, Gauge, Timer, Zap, ChevronLeft, User, Info, BarChart3 } from 'lucide-react';
import { trainApi } from '../services/api';

// ============================================================================
// 专业滤波器实现：二阶巴特沃斯低通滤波器 (Butterworth Filter)
// ============================================================================
// 该算法常用于生物力学分析，能有效滤除高频传感器噪声，同时保留身体肌肉发力的低频特征。
// 参数建议：采样率 1000Hz，截止频率 10-20Hz 效果最佳。
const butterworthFilter = (data, cutoff = 10, sampleRate = 1000) => {
  if (!data || data.length < 5) return data;

  const n = data.length;
  const simplifiedData = data.map(v => v || 0); // 处理空值
  const output = new Array(n).fill(0);

  // 预计算系数
  const fr = sampleRate / cutoff;
  const ohm = Math.tan(Math.PI / fr);
  const c = 1.0 + 2.0 * Math.cos(Math.PI / 4.0) * ohm + ohm * ohm;

  const b0 = (ohm * ohm) / c;
  const b1 = 2.0 * b0;
  const b2 = b0;
  const a1 = 2.0 * (ohm * ohm - 1.0) / c;
  const a2 = (1.0 - 2.0 * Math.cos(Math.PI / 4.0) * ohm + ohm * ohm) / c;

  // 正向滤波
  output[0] = simplifiedData[0];
  output[1] = simplifiedData[1];
  for (let i = 2; i < n; i++) {
    output[i] = b0 * simplifiedData[i] + b1 * simplifiedData[i - 1] + b2 * simplifiedData[i - 2]
      - a1 * output[i - 1] - a2 * output[i - 2];
  }

  // 反向滤波 (Zero-phase filtering): 消除相位延迟，确保峰值位置不动
  const finalOutput = new Array(n).fill(0);
  finalOutput[n - 1] = output[n - 1];
  finalOutput[n - 2] = output[n - 2];
  for (let i = n - 3; i >= 0; i--) {
    finalOutput[i] = b0 * output[i] + b1 * output[i + 1] + b2 * output[i + 2]
      - a1 * finalOutput[i + 1] - a2 * finalOutput[i + 2];
  }

  return finalOutput;
};

const TrainDetail = () => {
  const { id } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const response = await trainApi.getDetail(id);
        const { summary, chartData } = response;

        // 解析 CSV 数据: cnt, pos, speed, DTorque, STorque, Force, Dir
        // 表头提取
        let headers = [];
        let rows = [];
        if (chartData && chartData.length > 0) {
          headers = chartData[0].map(h => h.trim());
          rows = chartData.slice(1);
        }

        const formattedChart = rows.map(row => {
          const obj = {};
          headers.forEach((h, i) => {
            obj[h] = parseFloat(row[i]);
          });
          return {
            time: Number(((obj.cnt || 0) / 1000).toFixed(3)),
            force: obj.Force || 0,
            speed: obj.speed || 0,
            pos: obj.pos || 0
          };
        }).filter(item => !isNaN(item.time));

        // 应用专业滤波处理 (Butterworth Filter)
        const forceValues = formattedChart.map(i => i.force);
        const speedValues = formattedChart.map(i => i.speed);

        // 截止频率 15Hz (经验值)，消除高频采样毛刺
        const filteredForce = butterworthFilter(forceValues, 15, 1000);
        const filteredSpeed = butterworthFilter(speedValues, 15, 1000);

        const finalChartData = formattedChart.map((item, idx) => ({
          ...item,
          force: Number(filteredForce[idx].toFixed(2)),
          speed: -Number(filteredSpeed[idx].toFixed(2)) // 速度值正负取反
        }));

        // 深度合并逻辑：确保 summary 内的物理列（con_stre_max等）直接暴露给 data
        const finalData = {
          ...summary,
          chartData: finalChartData,
          // 确保计算项能基于最新数据生成
          weight: summary.weight || 1
        };
        setData(finalData);
      } catch (error) {
        console.error('获取训练详情失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) return <div className="page-container" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', color: 'var(--text-muted)' }}>正在挖掘数据深度...</div>;
  if (!data) return <div className="page-container" style={{ textAlign: 'center', padding: '100px' }}>未找到该记录</div>;

  // 辅助函数：格式化数值
  const formatVal = (val, fixed = 2) => {
    if (val === null || val === undefined || isNaN(val)) return '--';
    return parseFloat(val).toFixed(fixed);
  };

  // 辅助函数：格式化时间
  const formatDate = (dateStr) => {
    if (!dateStr) return '--';
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return dateStr;
    const pad = (n) => n.toString().padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;
  };

  // 根据类型获取标题和配置
  // type_id: 1 等速, 2 等张, 3 等长
  const isIsoK = data.type_id === 1; // 等速
  const isIsoT = data.type_id === 2; // 等张
  const isIsoM = data.type_id === 3; // 等长

  // 计算相对指标 (全量计算：物理量 / 体重)
  const weight = data.weight || 1;

  // 1. 相对力量 (kg/kg)
  const relConPeakStre = data.con_stre_max / weight;
  const relConAvgStre = data.con_stre_avg / weight;
  const relEccPeakStre = data.ecc_stre_max / weight;
  const relEccAvgStre = data.ecc_stre_avg / weight;

  // 2. 相对功率 (W/kg) - 用户指定修正：使用 power / weight
  const relConPeakPower = data.con_power_max / weight;
  const relConAvgPower = data.con_power_avg / weight;
  const relEccPeakPower = data.ecc_power_max / weight;
  const relEccAvgPower = data.ecc_power_avg / weight;

  // 3. 相对做功 (J/kg) - 用户指定修正：使用 work / weight
  const relConPeakWork = data.con_work_max / weight;
  const relConAvgWork = data.con_work_avg / weight;
  const relEccPeakWork = data.ecc_work_max / weight;
  const relEccAvgWork = data.ecc_work_avg / weight;

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out', padding: '24px', maxWidth: '1400px', margin: '0 auto' }}>
      {/* 顶部导航 */}
      <div style={{ marginBottom: '32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <button
            onClick={() => window.history.back()}
            style={{
              background: 'rgba(255,255,255,0.05)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '8px',
              padding: '8px',
              cursor: 'pointer',
              color: 'var(--text-color)',
              display: 'flex',
              alignItems: 'center'
            }}
          >
            <ChevronLeft size={20} />
          </button>
          <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '600' }}>数据详情剖析 - {data.type_name}</h2>
        </div>
        <div style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
          ID: <span style={{ color: 'var(--primary-color)' }}>{id}</span>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px', marginBottom: '32px' }}>
        {/* 1. 基本信息 */}
        <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><Info size={100} /></div>
          <h3 style={{ margin: '0 0 20px 0', borderLeft: '4px solid var(--primary-color)', paddingLeft: '12px', fontSize: '18px' }}>基本信息</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(100px, 1fr)', gap: '16px' }}>
            <InfoItem label="测试类别" value={data.type_name} />
            <InfoItem label="测试部位" value={data.part_name || '双腿'} />
            <InfoItem label="测试时间" value={formatDate(data.begin_time)} />
            <InfoItem label="测试组数" value={(data.cfg_group ?? '--') + ' 组'} />
            <InfoItem label="组间歇" value={(data.cfg_rest_time ?? '--') + 's'} />
            {isIsoK && <InfoItem label="测试速度" value={(data.cfg_con_speed ?? '--') + ' mm/s'} />}
            {isIsoT && <InfoItem label="测试阻力" value={(data.cfg_stre ?? '--') + ' kg'} />}
            {isIsoM && <InfoItem label="测试位置" value={(data.cfg_pos ?? '--') + ' mm'} />}
          </div>
        </div>

        {/* 2. 个人信息 */}
        <div className="card" style={{ padding: '24px', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', right: '-10px', top: '-10px', opacity: 0.1 }}><User size={100} /></div>
          <h3 style={{ margin: '0 0 20px 0', borderLeft: '4px solid #30d158', paddingLeft: '12px', fontSize: '18px' }}>个人信息</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(100px, 1fr) minmax(100px, 1fr)', gap: '16px' }}>
            <InfoItem label="姓名" value={data.user_name} />
            <InfoItem label="用户ID" value={data.uid} />
            <InfoItem label="组别" value={data.group_name} />
            <InfoItem label="性别" value={data.gender_name || '--'} />
            <InfoItem label="年龄" value={(data.age ?? '--') + ' 岁'} />
            <InfoItem label="身高" value={(data.height ?? '--') + ' cm'} />
            <InfoItem label="体重" value={(data.weight ?? '--') + ' kg'} />
            <InfoItem label="活动范围" value={`${data.cfg_roma || 0} - ${data.cfg_romb || 0} (mm)`} />
          </div>
        </div>
      </div>

      {/* 3. 数据表格 */}
      <div className="card" style={{ padding: '24px', marginBottom: '32px' }}>
        <h3 style={{ margin: '0 0 20px 0', borderLeft: '4px solid #ff9f0a', paddingLeft: '12px', fontSize: '18px' }}>数据指标</h3>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
            <thead>
              <tr style={{ background: 'rgba(255,255,255,0.05)', textAlign: 'left' }}>
                <th style={tableHeaderStyle}>参数</th>
                <th style={tableHeaderStyle}>{isIsoK ? '最大值(向心)' : '数值'}</th>
                {isIsoK && <th style={tableHeaderStyle}>平均值(向心)</th>}
                {isIsoK && <th style={tableHeaderStyle}>最大值(离心)</th>}
                {isIsoK && <th style={tableHeaderStyle}>平均值(离心)</th>}
              </tr>
            </thead>
            <tbody>
              {/* 等速测试行: 彻底对齐 24 格数据 */}
              {isIsoK && (
                <>
                  <DataRow label="峰值力量 (kg)" values={[formatVal(data.con_stre_max), formatVal(data.con_stre_avg), formatVal(data.ecc_stre_max), formatVal(data.ecc_stre_avg)]} />
                  <DataRow label="峰值功率 (W)" values={[formatVal(data.con_power_max), formatVal(data.con_power_avg), formatVal(data.ecc_power_max), formatVal(data.ecc_power_avg)]} />
                  <DataRow label="做功 (J)" values={[formatVal(data.con_work_max), formatVal(data.con_work_avg), formatVal(data.ecc_work_max), formatVal(data.ecc_work_avg)]} />
                  <DataRow label="相对峰值力量" values={[formatVal(relConPeakStre), formatVal(relConAvgStre), formatVal(relEccPeakStre), formatVal(relEccAvgStre)]} />
                  <DataRow label="相对峰值功率 (W/kg)" values={[formatVal(relConPeakPower), formatVal(relConAvgPower), formatVal(relEccPeakPower), formatVal(relEccAvgPower)]} />
                  <DataRow label="相对做功 (J/kg)" values={[formatVal(relConPeakWork), formatVal(relConAvgWork), formatVal(relEccPeakWork), formatVal(relEccAvgWork)]} />
                </>
              )}
              {/* 等张测试行 */}
              {isIsoT && (
                <>
                  <DataRow label="最大速度 (mm/s)" values={[formatVal(data.con_speed_max)]} />
                  <DataRow label="平均速度 (mm/s)" values={[formatVal(data.con_speed_avg)]} />
                  <DataRow label="最大功率 (W)" values={[formatVal(data.con_power_max)]} />
                  <DataRow label="平均功率 (W)" values={[formatVal(data.con_power_avg)]} />
                  <DataRow label="相对最大功率 (W/kg)" values={[formatVal(relConPeakPower)]} />
                </>
              )}
              {/* 等长测试行 */}
              {isIsoM && (
                <>
                  <DataRow label="最大力量 (kg)" values={[formatVal(data.con_stre_max)]} />
                  <DataRow label="平均力量 (kg)" values={[formatVal(data.con_stre_avg)]} />
                  <DataRow label="相对最大力量" values={[formatVal(relConPeakStre)]} />
                  <DataRow label="相对平均力量" values={[formatVal(relConAvgStre)]} />
                </>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* 4. 过程曲线图 */}
      <div className="chart-card" style={{ padding: '32px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
          <h3 style={{ margin: 0, fontSize: '18px' }}>
            过程曲线线图 ({isIsoT ? '速度 - 时间' : '力量 - 时间'})
          </h3>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', color: 'var(--text-muted)' }}>
              频率: 1000Hz
            </span>
          </div>
        </div>

        <div style={{ width: '100%', height: '500px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.chartData} margin={{ top: 10, right: 30, left: 20, bottom: 50 }}>
              <defs>
                <linearGradient id="colorPrimary" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="colorSuccess" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#30d158" stopOpacity={0.4} />
                  <stop offset="95%" stopColor="#30d158" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="rgba(255,255,255,0.85)"
                fontSize={12}
                minTickGap={50}
                tick={{ fill: 'rgba(255,255,255,0.95)' }}
                label={{ value: '时间 (s)', position: 'insideBottomRight', offset: -10, fill: 'rgba(255,255,255,0.85)', fontSize: 12 }}
              />
              <YAxis
                stroke="rgba(255,255,255,0.85)"
                fontSize={12}
                tick={{ fill: 'rgba(255,255,255,0.95)' }}
                label={{ value: isIsoT ? "速度 (mm/s)" : "力量 (kg)", angle: -90, position: 'insideLeft', fill: 'rgba(255,255,255,0.85)', fontSize: 12, offset: 10 }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(28, 28, 30, 0.95)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', backdropFilter: 'blur(10px)' }}
                itemStyle={{ fontSize: '13px' }}
                labelStyle={{ marginBottom: '8px', fontWeight: 'bold' }}
                labelFormatter={(value) => `时间: ${value} s`}
              />
              <Legend verticalAlign="top" height={36} />
              {isIsoT ? (
                <Area
                  type="monotone"
                  dataKey="speed"
                  stroke="var(--primary-color)"
                  fillOpacity={1}
                  fill="url(#colorPrimary)"
                  name="速度 (mm/s)"
                  dot={false}
                  isAnimationActive={false}
                />
              ) : (
                <Area
                  type="monotone"
                  dataKey="force"
                  stroke="#30d158"
                  fillOpacity={1}
                  fill="url(#colorSuccess)"
                  name="力量 (kg)"
                  dot={false}
                  isAnimationActive={false}
                />
              )}
              <Brush dataKey="time" height={30} stroke="rgba(255,255,255,0.1)" fill="rgba(44, 44, 46, 0.8)" startIndex={0} endIndex={data.chartData?.length - 1} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

// 辅助子组件
const InfoItem = ({ label, value }) => (
  <div style={{ padding: '8px 0' }}>
    <span style={{ fontSize: '13px', color: 'var(--text-muted)', display: 'block', marginBottom: '4px' }}>{label}</span>
    <span style={{ fontSize: '15px', fontWeight: '500' }}>{value || '--'}</span>
  </div>
);

const DataRow = ({ label, values }) => (
  <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <td style={{ padding: '16px', color: 'var(--text-muted)', fontWeight: '500' }}>{label}</td>
    {values.map((v, i) => (
      <td key={i} style={{ padding: '16px' }}>{v}</td>
    ))}
  </tr>
);

const tableHeaderStyle = {
  padding: '16px',
  color: 'var(--text-secondary)',
  fontSize: '13px',
  fontWeight: '600'
};

export default TrainDetail;
