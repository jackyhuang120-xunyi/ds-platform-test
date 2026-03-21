import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  RadarChart, Radar, PolarGrid, PolarAngleAxis, ResponsiveContainer,
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from 'recharts';
import {
  User, Award, TrendingUp, ChevronRight, ArrowLeft,
  Zap, Dumbbell, Timer, BarChart2, Calendar,
  ArrowLeftToLine, ArrowRightToLine, Columns,
  RotateCcw, LineChart as LineChartIcon, Info,
  Trophy, Medal, Target, ArrowUpDown
} from 'lucide-react';
import { userApi, trainApi } from '../services/api';
import { format, differenceInDays } from 'date-fns';
import Pagination from '../components/Pagination';

/* ─────────────────────────────────────────────
   辅助工具
───────────────────────────────────────────── */
const fmt = (v, digits = 2) => {
  const n = parseFloat(v);
  return (v === null || v === undefined || isNaN(n)) ? '--' : n.toFixed(digits);
};

const TYPE_COLOR = {
  1: { color: '#007AFF', bg: 'rgba(0,122,255,0.12)', label: '等速', border: 'rgba(0,122,255,0.3)' },
  2: { color: '#FF9500', bg: 'rgba(255,149,0,0.12)', label: '等张', border: 'rgba(255,149,0,0.3)' },
  3: { color: '#AF52DE', bg: 'rgba(175,82,222,0.12)', label: '等长', border: 'rgba(175,82,222,0.3)' },
};

const PART_ICON = {
  '左腿': { Icon: ArrowLeftToLine, color: '#fb923c' },
  '右腿': { Icon: ArrowRightToLine, color: '#4ade80' },
  '双腿': { Icon: Columns, color: '#60a5fa' },
};

/* ─────────────────────────────────────────────
   子组件：统计卡片
───────────────────────────────────────────── */
const StatCard = ({ icon: Icon, iconColor, label, value, sublabel }) => (
  <div style={{
    background: 'rgba(255,255,255,0.04)',
    border: '1px solid rgba(255,255,255,0.08)',
    borderRadius: '20px',
    padding: '24px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    transition: 'all 0.3s ease',
  }}
    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'}
    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
  >
    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
      <div style={{
        width: '40px', height: '40px', borderRadius: '12px',
        background: `${iconColor}20`, display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        <Icon size={20} color={iconColor} />
      </div>
      <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.7)', letterSpacing: '0.5px' }}>{label}</span>
    </div>
    <div style={{ fontSize: '36px', fontWeight: '800', color: '#FFFFFF', lineHeight: 1.1 }}>{(value === null || value === undefined) ? '--' : value}</div>
    {sublabel && <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{sublabel}</div>}
  </div>
);

/** 荣耀时刻卡片 */
const GloryMomentCard = ({ title, value, unit, time, icon: Icon, color, onClick }) => (
  <div
    onClick={onClick}
    style={{
      background: `linear-gradient(135deg, ${color}15 0%, rgba(255,255,255,0.02) 100%)`,
      border: `1px solid ${color}30`,
      borderRadius: '24px',
      padding: '24px',
      position: 'relative',
      overflow: 'hidden',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      cursor: onClick ? 'pointer' : 'default',
      transition: 'all 0.3s ease',
    }}
    onMouseEnter={e => { if (onClick) e.currentTarget.style.transform = 'translateY(-5px) scale(1.02)'; }}
    onMouseLeave={e => { if (onClick) e.currentTarget.style.transform = 'translateY(0) scale(1)'; }}
  >
    <div style={{ position: 'absolute', right: '-10px', bottom: '-10px', opacity: 0.1 }}>
      <Icon size={80} color={color} />
    </div>
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Icon size={16} color="#000" />
      </div>
      <span style={{ fontSize: '14px', fontWeight: '700', color: 'rgba(255,255,255,0.9)' }}>{title}</span>
    </div>
    <div style={{ display: 'flex', alignItems: 'baseline', gap: '4px' }}>
      <span style={{ fontSize: '32px', fontWeight: '900', color: '#FFF' }}>{fmt(value)}</span>
      <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{unit}</span>
    </div>
    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', gap: '4px' }}>
      <Calendar size={12} />
      达成于 {time ? format(new Date(time), 'yyyy.MM.dd') : '未知时间'}
    </div>
  </div>
);

/* ─────────────────────────────────────────────
   子组件：PB 矩阵表格 (对齐规范 v2)
───────────────────────────────────────────── */
const PBPanel = ({ pb, weight }) => {
  const [activeTab, setActiveTab] = useState(1);
  const data = pb[activeTab];
  const w = parseFloat(weight) || 1;
  const color = TYPE_COLOR[activeTab]?.color || '#007AFF';

  // 渲染等速矩阵 (6x4)
  const renderIsokineticTable = () => (
    <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <table className="pb-matrix-table">
        <thead>
          <tr>
            <th>指标项目</th>
            <th>向心最大</th>
            <th>向心平均</th>
            <th>离心最大</th>
            <th>离心平均</th>
          </tr>
        </thead>
        <tbody>
          <PBRow label="峰值力量 (kg)" values={[data.max_con_stre_max, data.max_con_stre_avg, data.max_ecc_stre_max, data.max_ecc_stre_avg]} color={color} />
          <PBRow label="峰值功率 (W)" values={[data.max_con_power_max, data.max_con_power_avg, data.max_ecc_power_max, data.max_ecc_power_avg]} color={color} />
          <PBRow label="做功 (J)" values={[data.max_con_work_max, data.max_con_work_avg, data.max_ecc_work_max, data.max_ecc_work_avg]} color={color} />
          <PBRow label="相对指标" isSection />
          <PBRow label="相对力量 (kg/kg)" values={[data.max_con_stre_max / w, data.max_con_stre_avg / w, data.max_ecc_stre_max / w, data.max_ecc_stre_avg / w]} color={color} />
          <PBRow label="相对功率 (W/kg)" values={[data.max_con_power_max / w, data.max_con_power_avg / w, data.max_ecc_power_max / w, data.max_ecc_power_avg / w]} color={color} />
          <PBRow label="相对做功 (J/kg)" values={[data.max_con_work_max / w, data.max_con_work_avg / w, data.max_ecc_work_max / w, data.max_ecc_work_avg / w]} color={color} />
        </tbody>
      </table>
    </div>
  );

  // 渲染等张/等长简易表格
  const renderSimpleTable = (rows) => (
    <div style={{ overflowX: 'auto', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' }}>
      <table className="pb-matrix-table">
        <thead>
          <tr>
            <th>指标项目</th>
            <th>数值</th>
            <th>单位</th>
            <th>说明</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td style={{ color: 'rgba(255,255,255,0.8)', fontWeight: '500' }}>{r.label}</td>
              <td style={{ color, fontWeight: '700', fontSize: '18px' }}>{fmt(r.val)}</td>
              <td style={{ color: 'rgba(255,255,255,0.4)', fontSize: '12px' }}>{r.unit}</td>
              <td style={{ color: 'rgba(255,255,255,0.5)', fontSize: '12px' }}>{r.desc}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );

  return (
    <div>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
        {[1, 2, 3].map(t => (
          <button key={t} onClick={() => setActiveTab(t)} style={{
            padding: '8px 20px', borderRadius: '12px', border: `1px solid ${activeTab === t ? TYPE_COLOR[t].color : 'rgba(255,255,255,0.1)'}`,
            background: activeTab === t ? TYPE_COLOR[t].bg : 'transparent', color: activeTab === t ? TYPE_COLOR[t].color : 'var(--text-muted)',
            fontWeight: activeTab === t ? '700' : '400', cursor: 'pointer', transition: 'all 0.2s'
          }}>
            {TYPE_COLOR[t].label}
          </button>
        ))}
      </div>
      {!data ? (
        <div style={{ color: 'var(--text-disabled)', padding: '40px', textAlign: 'center' }}>该模式暂无历史记录</div>
      ) : (
        <>
          {activeTab === 1 && renderIsokineticTable()}
          {activeTab === 2 && renderSimpleTable([
            { label: '最大速度', val: data.max_con_speed_max, unit: 'mm/s', desc: '恒定阻力下最大向心收缩速率' },
            { label: '平均速度', val: data.max_con_speed_avg, unit: 'mm/s', desc: '全程向心收缩平均速率' },
            { label: '最大功率', val: data.max_con_power_max, unit: 'W', desc: '瞬时最大能量输出' },
            { label: '平均功率', val: data.max_con_power_avg, unit: 'W', desc: '全程爆发力平均水平' },
            { label: '相对最大功率', val: data.max_con_power_max / w, unit: 'W/kg', desc: '单位体重的爆发力强度指数' },
            { label: '相对平均功率', val: data.max_con_power_avg / w, unit: 'W/kg', desc: '单位体重的平均爆发效率' },
          ])}
          {activeTab === 3 && renderSimpleTable([
            { label: '最大力量', val: data.max_con_stre_max, unit: 'kg', desc: '固定角度下的最大绝对静力' },
            { label: '平均力量', val: data.max_con_stre_avg, unit: 'kg', desc: '持力过程中的平均发力水平' },
            { label: '相对最大力量', val: data.max_con_stre_max / w, unit: 'kg/kg', desc: '静态发力密度指数' },
            { label: '相对平均力量', val: data.max_con_stre_avg / w, unit: 'kg/kg', desc: '平均静力发力水平指标' },
          ])}
        </>
      )}
    </div>
  );
};

const PBRow = ({ label, values, isSection, color }) => (
  <tr style={{ background: isSection ? 'rgba(255,255,255,0.02)' : 'transparent', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
    <td style={{ padding: '14px 20px', color: isSection ? 'var(--primary-light)' : 'rgba(255,255,255,0.7)', fontWeight: isSection ? '700' : '500', fontSize: '13px' }}>{label}</td>
    {!isSection && values.map((v, i) => (
      <td key={i} style={{ padding: '14px 20px', color: (v > 0) ? '#FFFFFF' : 'rgba(255,255,255,0.3)', fontWeight: '600', textAlign: 'center' }}>{fmt(v)}</td>
    ))}
    {isSection && <td colSpan={4} />}
  </tr>
);

/* ─────────────────────────────────────────────
   趋势图组件：多图联运方案 (Synchronized Charts)
───────────────────────────────────────────── */
const TrendSection = ({ userId }) => {
  const [typeId, setTypeId] = useState(1);
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTrend = async () => {
      try {
        setLoading(true);
        const res = await userApi.getTrend(userId, { typeId, limit: 30 });
        const formatted = (res || []).map(d => ({
          ...d,
          unixTime: new Date(d.time).getTime(),
          displayDate: format(new Date(d.time), 'MM-dd'),
          fullTime: format(new Date(d.time), 'yyyy-MM-dd HH:mm')
        }));
        setData(formatted);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    fetchTrend();
  }, [userId, typeId]);

  const config = {
    1: [
      { key: 'con_stre_max', label: '峰值力量 (kg)', color: '#007AFF', unit: 'kg' },
      { key: 'con_power_max', label: '峰值功率 (W)', color: '#30D158', unit: 'W' },
      { key: 'con_work_max', label: '做功总量 (J)', color: '#AF52DE', unit: 'J' },
    ],
    2: [
      { key: 'con_speed_max', label: '最大收缩速度 (mm/s)', color: '#FF9500', unit: 'mm/s' },
      { key: 'con_power_max', label: '瞬时最大功率 (W)', color: '#30D158', unit: 'W' },
    ],
    3: [
      { key: 'con_stre_max', label: '静态最大力量 (kg)', color: '#007AFF', unit: 'kg' },
    ]
  };

  const charts = config[typeId] || [];

  return (
    <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
        <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', display: 'flex', alignItems: 'center', gap: '10px' }}>
          <LineChartIcon size={20} color="#FF2D55" /> 历史指标趋势分析 (同步联动视图)
        </h3>
        <div style={{ display: 'flex', gap: '4px', background: 'rgba(255,255,255,0.05)', padding: '4px', borderRadius: '12px' }}>
          {[1, 2, 3].map(t => (
            <button key={t} onClick={() => setTypeId(t)} style={{
              padding: '6px 16px', borderRadius: '8px', border: 'none', fontSize: '13px', cursor: 'pointer',
              background: typeId === t ? 'rgba(255,255,255,0.1)' : 'transparent', color: typeId === t ? 'var(--text-primary)' : 'rgba(255,255,255,0.4)',
              fontWeight: typeId === t ? '700' : '400', transition: 'all 0.2s'
            }}>{TYPE_COLOR[t].label}</button>
          ))}
        </div>
      </div>

      {loading ? <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF' }}>挖掘数据库中...</div> :
        data.length === 0 ? <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.4)' }}>暂无足够采样点</div> :
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            {charts.map((c, idx) => (
              <div key={c.key} style={{
                background: 'rgba(255,255,255,0.01)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                padding: '16px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px', borderLeft: `3px solid ${c.color}`, paddingLeft: '10px' }}>
                  <h4 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#FFFFFF' }}>{c.label}</h4>
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>{c.unit}</span>
                </div>

                <div style={{ height: '180px', width: '100%', cursor: 'crosshair' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={data} syncId="userTrend" margin={{ top: 5, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis
                        dataKey="unixTime"
                        hide={idx !== charts.length - 1}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                        tickFormatter={(time) => format(new Date(time), 'MM-dd')}
                        minTickGap={30}
                      />
                      <YAxis
                        width={40}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 10, fill: 'rgba(255,255,255,0.6)' }}
                        domain={['auto', 'auto']}
                      />
                      <Tooltip
                        trigger="axis"
                        isAnimationActive={false}
                        labelFormatter={(time) => format(new Date(time), 'yyyy-MM-dd HH:mm')}
                        contentStyle={{
                          background: '#1c1c1e',
                          border: '1px solid rgba(255,255,255,0.2)',
                          borderRadius: '12px',
                          fontSize: '12px',
                          color: '#FFF',
                          boxShadow: '0 8px 32px rgba(0,0,0,0.4)'
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={c.key}
                        name={c.label}
                        stroke={c.color}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: c.color, strokeWidth: 0 }}
                        activeDot={{ r: 5, strokeWidth: 0 }}
                        isAnimationActive={false}
                        connectNulls={true}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ))}
          </div>
      }

    </div>
  );
};

/* ─────────────────────────────────────────────
   主页面
───────────────────────────────────────────── */
const UserSummary = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [glory, setGlory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [metadata, setMetadata] = useState({ types: [], parts: [] });

  // 列表相关
  const [recordsPage, setRecordsPage] = useState(1);
  const [recordsData, setRecordsData] = useState([]);
  const [recordsTotal, setRecordsTotal] = useState(0);
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [filters, setFilters] = useState({ typeId: 'all', partId: 'all', startDate: '', endDate: '' });
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'DESC' });
  const [selectedIds, setSelectedIds] = useState([]);
  const recordsPageSize = 10;

  const toggleSelect = useCallback((record) => {
    const id = record.id;
    if (selectedIds.includes(id)) {
      setSelectedIds(prev => prev.filter(i => i !== id));
    } else {
      // 核心约束：同类型运动校验
      if (selectedIds.length > 0) {
        const firstSelected = recordsData.find(r => r.id === selectedIds[0]);
        if (firstSelected && firstSelected.type_id !== record.type_id) {
          alert(`对比失败：只能对比相同类型的运动。请选择“${firstSelected.type_name}”记录。`);
          return;
        }
      }
      setSelectedIds(prev => [...prev, id]);
    }
  }, [selectedIds, recordsData]);

  useEffect(() => {
    const init = async () => {
      try {
        const [u, m, g] = await Promise.all([
          userApi.getById(id),
          trainApi.getMetadata(),
          userApi.getGloryMoments(id)
        ]);
        setUser(u); setMetadata(m); setGlory(g || []);
        if (u?.recentRecords) { setRecordsData(u.recentRecords.data); setRecordsTotal(u.recentRecords.total); }
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    init();
  }, [id]);

  const fetchRecords = useCallback(async (p, f = filters, s = sortConfig) => {
    try {
      setRecordsLoading(true);
      const res = await userApi.getRecords(id, { page: p, pageSize: recordsPageSize, ...f, sortBy: s.key, sortOrder: s.direction });
      setRecordsData(res.data); setRecordsTotal(res.total);
    } catch (err) { console.error(err); } finally { setRecordsLoading(false); }
  }, [id, filters, sortConfig]);

  // 只有当筛选或排序变更时，才执行重置并触发
  useEffect(() => {
    if (!loading && user) {
      if (recordsPage === 1) {
        fetchRecords(1); // 如果原本就是第1页，直接刷新数据
      } else {
        setRecordsPage(1); // 如果原本不是第1页，修改状态会触发下面的 useEffect
      }
    }
  }, [filters, sortConfig]);

  // 当页码确认变更时，统一执行数据抓取
  useEffect(() => {
    if (!loading && user) {
      fetchRecords(recordsPage);
    }
  }, [recordsPage]);

  if (loading) return <div className="page-loading"><div className="spinner" /></div>;
  if (!user) return <div className="page-empty">用户数据丢失</div>;

  const { stats, pb } = user;
  const genderColor = user.gender === '男' ? '#007AFF' : user.gender === '女' ? '#FF2D55' : '#8E8E93';

  // 雷达：规范化处理
  const radarData = (() => {
    const k = pb?.[1] || {}, t = pb?.[2] || {}, m = pb?.[3] || {};
    const bl = metadata.baselines || { isokinetic_con: 220, isokinetic_ecc: 220, isotonic_speed: 1000, isometric_stre: 220, activity: 50 };
    const norm = (v, max) => Math.min(120, Math.round((parseFloat(v) || 0) / max * 100)); // 允许超过100%一点点以展示突破
    return [
      { subject: '等速向心力量', A: norm(k.max_con_stre_max, bl.isokinetic_con), Full: 100 },
      { subject: '等速离心对比', A: norm(k.max_ecc_stre_max, bl.isokinetic_ecc), Full: 100 },
      { subject: '等张爆发速度', A: norm(t.max_con_speed_max, bl.isotonic_speed), Full: 100 },
      { subject: '等长最大静力', A: norm(m.max_con_stre_max, bl.isometric_stre), Full: 100 },
      { subject: '活跃度', A: norm(stats?.total_count || 0, bl.activity), Full: 100 },
    ];
  })();

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.6s ease-out' }}>
      {/* A. 英雄头图 */}
      <div style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.08) 0%, rgba(255,255,255,0.02) 100%)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '32px', padding: '40px', marginBottom: '32px' }}>
        <div style={{ display: 'flex', gap: '40px', alignItems: 'center' }}>
          <div style={{ width: '120px', height: '120px', borderRadius: '30px', background: `${genderColor}15`, border: `3px solid ${genderColor}30`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={64} color={genderColor} /></div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
              <h1 style={{ fontSize: '36px', margin: 0, fontWeight: '900', letterSpacing: '-0.5px' }}>{user.name}</h1>
              <span style={{ padding: '6px 16px', borderRadius: '24px', fontSize: '14px', fontWeight: '700', background: `${genderColor}20`, color: genderColor }}>{user.gender}</span>
              <span style={{ color: 'var(--text-disabled)', fontSize: '14px' }}>#{user.id}</span>
            </div>
            <div style={{ display: 'flex', gap: '32px', color: 'var(--text-muted)' }}>
              <span><span style={{ color: 'var(--text-disabled)' }}>组别：</span>{user.group_name}</span>
              <span><span style={{ color: 'var(--text-disabled)' }}>身高：</span>{user.height}cm</span>
              <span><span style={{ color: 'var(--text-disabled)' }}>体重：</span>{user.weight}kg</span>
              <span><span style={{ color: 'var(--text-disabled)' }}>年龄：</span>{user.age}岁</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button className="btn btn-secondary" style={{ borderRadius: '16px' }} onClick={() => navigate(-1)}><ArrowLeft size={18} /> 返回</button>
            <button className="btn btn-primary" style={{ borderRadius: '16px' }} onClick={() => navigate('/ranking')}><Award size={18} /> 排行榜</button>
          </div>
        </div>
      </div>

      {/* B. 数据磁贴 */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '32px' }}>
        <StatCard icon={BarChart2} iconColor="#007AFF" label="总训练次数" value={stats?.total_count} sublabel={`等速 ${stats?.isokinetic_count || 0} | 等张 ${stats?.isotonic_count || 0} | 等长 ${stats?.isometric_count || 0}`} />
        <StatCard icon={Calendar} iconColor="#30D158" label="最近训练" value={stats?.last_train_time ? format(new Date(stats.last_train_time), 'MM-dd') : '无记录'} sublabel={stats?.last_train_time ? format(new Date(stats.last_train_time), 'HH:mm') : '-'} />
        <StatCard icon={Zap} iconColor="#FF9500" label="等张最大速度" value={fmt(pb?.[2]?.max_con_speed_max)} sublabel="mm/s" />
        <StatCard icon={Dumbbell} iconColor="#AF52DE" label="最大绝对力量" value={fmt(pb?.[1]?.max_con_stre_max)} sublabel="kg" />
      </div>

      {/* C. 个人巅峰时刻 */}
      <div style={{ marginBottom: '40px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
          <div style={{ width: '4px', height: '18px', background: '#FFD700', borderRadius: '2px' }}></div>
          <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#FFF' }}>
            巅峰时刻荣誉榜
          </h3>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>PERSONAL BEST MOMENTS</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '24px' }}>
          <GloryMomentCard
            title="等速巅峰力量"
            value={glory.find(g => g.type === 1)?.value}
            unit="kg"
            time={glory.find(g => g.type === 1)?.time}
            icon={Trophy}
            color="#FFD700"
            onClick={() => { const id = glory.find(g => g.type === 1)?.id; if (id) navigate(`/train-detail/${id}`); }}
          />
          <GloryMomentCard
            title="等张极限速度"
            value={glory.find(g => g.type === 2)?.value}
            unit="mm/s"
            time={glory.find(g => g.type === 2)?.time}
            icon={Zap}
            color="#FF9500"
            onClick={() => { const id = glory.find(g => g.type === 2)?.id; if (id) navigate(`/train-detail/${id}`); }}
          />
          <GloryMomentCard
            title="等长绝对静力"
            value={glory.find(g => g.type === 3)?.value}
            unit="kg"
            time={glory.find(g => g.type === 3)?.time}
            icon={Target}
            color="#00D2FF"
            onClick={() => { const id = glory.find(g => g.type === 3)?.id; if (id) navigate(`/train-detail/${id}`); }}
          />
        </div>
      </div>

      {/* C. 核心分析 */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr', gap: '24px', marginBottom: '32px' }}>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
            <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}><Award size={22} color="#FFD700" style={{ verticalAlign: 'bottom', marginRight: '8px' }} /> 专家指标矩阵</h3>
            <span style={{ fontSize: '13px', color: 'var(--text-disabled)' }}><Info size={14} style={{ verticalAlign: 'text-bottom' }} /> 相对指标已根据最新体重同步计算</span>
          </div>
          <PBPanel pb={pb || {}} weight={user.weight} />
        </div>
        <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
          <h3 style={{ margin: '0 0 24px 0', fontSize: '20px', fontWeight: '800' }}><TrendingUp size={22} color="#007AFF" style={{ verticalAlign: 'bottom', marginRight: '8px' }} /> 数字雷达</h3>
          <div style={{ height: '320px' }}>
            <ResponsiveContainer>
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(255,255,255,0.1)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: 'var(--text-disabled)', fontSize: 12 }} />
                {/* 顶尖水平背景线 P99 */}
                <Radar
                  name="全站顶尖水平 (P99)"
                  dataKey="Full"
                  stroke="rgba(255,255,255,0.4)"
                  fill="rgba(255,255,255,0.1)"
                  fillOpacity={0.15}
                  strokeDasharray="5 5"
                  strokeWidth={1.5}
                />
                {/* 个人数据线 */}
                <Radar
                  name="个人当前水平"
                  dataKey="A"
                  stroke="#007AFF"
                  fill="#007AFF"
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
                <Tooltip
                  contentStyle={{ background: '#1c1c1e', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '12px', fontSize: '12px' }}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* D. 趋势变化 */}
      <div style={{ marginBottom: '32px' }}>
        <TrendSection userId={id} />
      </div>

      {/* E. 训练历史 */}
      <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px' }}>
          <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '800' }}>详细训练历史记录 <span style={{ fontSize: '14px', fontWeight: '400', color: 'var(--text-disabled)', marginLeft: '12px' }}>共 {recordsTotal} 条数据</span></h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {selectedIds.length >= 2 && (
              <button
                className="btn btn-primary btn-sm"
                style={{
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={() => {
                  const ids = selectedIds.join(',');
                  window.location.href = `/comparison?ids=${ids}`;
                }}
              >
                <ArrowUpDown size={16} />
                开启对比 ({selectedIds.length})
              </button>
            )}
            <button className="btn btn-secondary btn-sm" style={{ borderRadius: '12px' }} onClick={() => {
              setFilters({ typeId: 'all', partId: 'all', startDate: '', endDate: '' });
              setSelectedIds([]);
            }}><RotateCcw size={14} /> 重置</button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 1fr', gap: '16px', marginBottom: '24px' }}>
          <div className="filter-group"><label>测试类型</label><select value={filters.typeId} onChange={e => setFilters({ ...filters, typeId: e.target.value })}><option value="all">所有类型</option>{metadata.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}</select></div>
          <div className="filter-group"><label>测试部位</label><select value={filters.partId} onChange={e => setFilters({ ...filters, partId: e.target.value })}><option value="all">所有部位</option>{metadata.parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}</select></div>
          <div className="filter-group"><label>起止时间</label><input type="date" value={filters.startDate} onChange={e => setFilters({ ...filters, startDate: e.target.value })} /></div>
          <div className="filter-group"><label>&nbsp;</label><input type="date" value={filters.endDate} onChange={e => setFilters({ ...filters, endDate: e.target.value })} /></div>
        </div>

        <div className="data-table-container">
          <table className="user-records-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}><div style={{ width: '20px' }}></div></th>
                <th onClick={() => setSortConfig({ key: 'id', direction: sortConfig.direction === 'DESC' ? 'ASC' : 'DESC' })}>训练ID</th>
                <th>运动类型</th>
                <th onClick={() => setSortConfig({ key: 'time', direction: sortConfig.direction === 'DESC' ? 'ASC' : 'DESC' })}>训练时间</th>
                <th>核心配置</th>
                <th>测试部位</th>
                <th onClick={() => setSortConfig({ key: 'con_stre_max', direction: sortConfig.direction === 'DESC' ? 'ASC' : 'DESC' })}>峰值力量</th>
                <th>操作</th>
              </tr>
            </thead>
            <tbody>
              {recordsLoading ? (<tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px' }}>检索中...</td></tr>) :
                recordsData.length === 0 ? (<tr><td colSpan={8} style={{ textAlign: 'center', padding: '60px' }}>未匹配到符合条件的记录</td></tr>) :
                  recordsData.map(r => {
                    const tc = TYPE_COLOR[r.type_id] || {};
                    const PartIcon = PART_ICON[r.part_name]?.Icon;
                    return (
                      <tr
                        key={r.id}
                        onClick={() => navigate(`/train-detail/${r.id}`)}
                        className={selectedIds.includes(r.id) ? 'selected-row' : ''}
                      >
                        <td onClick={(e) => e.stopPropagation()}>
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(r.id)}
                            onChange={() => toggleSelect(r)}
                            style={{ cursor: 'pointer' }}
                          />
                        </td>
                        <td style={{ color: 'var(--primary-light)', fontWeight: '700' }}>#{r.id}</td>
                        <td><span className="badge-modern" style={{ background: tc.color, color: '#fff', border: 'none', boxShadow: `0 2px 6px ${tc.color}40` }}>{r.type_name}</span></td>
                        <td style={{ fontSize: '13px' }}>{r.time ? format(new Date(r.time), 'yyyy-MM-dd HH:mm') : '--'}</td>
                        <td><span style={{ fontWeight: '700' }}>{r.type_id === 1 ? r.cfg_con_speed : r.type_id === 2 ? r.cfg_stre : r.cfg_pos}</span> <span style={{ fontSize: '11px', color: 'var(--text-disabled)' }}>{r.type_id === 1 ? 'mm/s' : r.type_id === 2 ? 'kg' : 'mm'}</span></td>
                        <td><div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>{PartIcon && <PartIcon size={14} color={PART_ICON[r.part_name].color} />}{r.part_name}</div></td>
                        <td style={{ fontWeight: '700' }}>{fmt(r.con_stre_max)} <span style={{ fontSize: '11px', fontWeight: '400' }}>kg</span></td>
                        <td><ChevronRight size={18} color="var(--text-disabled)" /></td>
                      </tr>
                    );
                  })}
            </tbody>
          </table>
        </div>
        <Pagination total={recordsTotal} page={recordsPage} pageSize={recordsPageSize} onPageChange={setRecordsPage} />
      </div>

      <style>{`
        .pb-matrix-table { width: 100%; border-collapse: collapse; background: rgba(0,0,0,0.2); }
        .pb-matrix-table th { padding: 14px; text-align: center; background: rgba(255,255,255,0.06); color: rgba(255,255,255,0.95); font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid rgba(255,255,255,0.1); }
        .pb-matrix-table td { border-right: 1px solid rgba(255,255,255,0.03); }
        .pb-matrix-table td:last-child { border-right: none; }
        
        .user-records-table { width: 100%; border-collapse: collapse; }
        .user-records-table th { text-align: left; padding: 16px; background: rgba(255,255,255,0.03); font-size: 13px; color: rgba(255,255,255,0.8); cursor: pointer; border-bottom: 2px solid rgba(255,255,255,0.05); }
        .user-records-table td { padding: 16px; border-bottom: 1px solid rgba(255,255,255,0.04); font-size: 14px; cursor: pointer; }

        .user-records-table tr:hover { background: rgba(255,255,255,0.03); }
        .user-records-table .selected-row { background: rgba(0, 122, 255, 0.08) !important; }
        .user-records-table .selected-row:hover { background: rgba(0, 122, 255, 0.12) !important; }
        
        .badge-modern { padding: 4px 12px; border-radius: 6px; font-size: 12px; font-weight: 700; display: inline-block; min-width: 60px; text-align: center; }
        .filter-group { display: flex; flexDirection: column; gap: 6px; }
        .filter-group label { fontSize: 11px; color: var(--text-disabled); text-transform: uppercase; margin-left: 4px; }
        .page-loading { display: flex; justify-content: center; alignItems: center; minHeight: 60vh; }
        .spinner { width: 50px; height: 50px; border: 4px solid rgba(0,122,255,0.1); border-top-color: #007AFF; border-radius: 50%; animation: spin 1s linear infinite; }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
};

export default UserSummary;
