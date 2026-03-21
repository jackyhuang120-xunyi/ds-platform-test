import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area 
} from 'recharts';
import { Download, TrendingUp, Users, Zap, Calendar } from 'lucide-react';

const data = [
  { name: '03-01', value: 400, active: 24, speed: 8.2 },
  { name: '03-03', value: 300, active: 13, speed: 7.8 },
  { name: '03-05', value: 500, active: 38, speed: 9.1 },
  { name: '03-07', value: 278, active: 39, speed: 8.5 },
  { name: '03-09', value: 189, active: 48, speed: 8.0 },
  { name: '03-11', value: 239, active: 38, speed: 8.9 },
  { name: '03-13', value: 349, active: 43, speed: 9.4 },
];

const Dashboard = () => {
  const handleExport = () => {
    console.log('导出 CSV...');
    alert('正在准备数据导出...');
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      {/* 统计卡片矩阵 */}
      <div className="stat-grid" style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', 
        gap: '24px', 
        marginBottom: '32px' 
      }}>
        <div className="stat-card">
          <div className="stat-icon"><TrendingUp size={32} color="var(--primary-color)" /></div>
          <div className="stat-content">
            <h3>1,280</h3>
            <p>总训练次数</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Users size={32} color="var(--success-color)" /></div>
          <div className="stat-content">
            <h3>85</h3>
            <p>活跃运动员</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Zap size={32} color="var(--warning-color)" /></div>
          <div className="stat-content">
            <h3>9.8</h3>
            <p>峰值速度 (m/s)</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><Calendar size={32} color="var(--info-color)" /></div>
          <div className="stat-content">
            <h3>24</h3>
            <p>本月新增记录</p>
          </div>
        </div>
      </div>

      {/* 全局趋势大图 */}
      <div className="chart-card" style={{ padding: '32px', marginBottom: '32px', minHeight: '500px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h2 style={{ fontSize: '24px', margin: '0 0 8px 0' }}>全局趋势概览</h2>
            <p style={{ color: 'var(--text-muted)', margin: 0 }}>展示过去两周的训练负荷与表现趋势</p>
          </div>
          <button className="btn btn-primary" onClick={handleExport}>
            <Download size={18} />
            一键全量导出 CSV
          </button>
        </div>

        <div style={{ width: '100%', height: '350px' }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="var(--primary-color)" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="var(--primary-color)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
              <XAxis 
                dataKey="name" 
                stroke="var(--text-disabled)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dy={10}
              />
              <YAxis 
                stroke="var(--text-disabled)" 
                fontSize={12} 
                tickLine={false} 
                axisLine={false}
                dx={-10}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: 'rgba(28, 28, 30, 0.9)', 
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  backdropFilter: 'blur(10px)',
                  boxShadow: 'var(--shadow-large)'
                }}
                itemStyle={{ color: '#fff' }}
              />
              <Area 
                type="monotone" 
                dataKey="value" 
                stroke="var(--primary-color)" 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorValue)" 
                name="训练负荷"
              />
              <Area 
                type="monotone" 
                dataKey="speed" 
                stroke="var(--success-color)" 
                strokeWidth={3}
                fill="transparent"
                name="平均速度"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
