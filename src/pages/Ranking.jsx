import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Medal, ChevronDown, User, Activity, Zap, Shield, ChevronUp, ExternalLink, Dumbbell, Move, Timer, Navigation, Scale, ArrowLeftToLine, ArrowRightToLine, Columns, Footprints } from 'lucide-react';
import Pagination from '../components/Pagination';
import { trainApi } from '../services/api';

// 指标定义配置
const METRIC_CONFIG = {
  isokinetic: {
    id: 1,
    label: '等速模式 (IsoK)',
    paramLabel: '测试速度',
    paramUnit: '°/s',
    metrics: [
      { key: 'con_stre_max', label: '向心峰值力量', unit: 'kg' },
      { key: 'con_stre_avg', label: '向心平均力量', unit: 'kg' },
      { key: 'con_power_max', label: '向心峰值功率', unit: 'W' },
      { key: 'con_work_max', label: '向心总做功', unit: 'J' },
      { key: 'rel_con_stre_max', label: '相对峰值力量', unit: 'kg/kg' },
      { key: 'rel_con_power_max', label: '相对峰值功率', unit: 'W/kg' },
      { key: 'rel_con_work_max', label: '相对总做功', unit: 'J/kg' },
      { key: 'ecc_stre_max', label: '离心峰值力量', unit: 'kg' },
      { key: 'ecc_power_max', label: '离心峰值功率', unit: 'W' },
    ]
  },
  isotonic: {
    id: 2,
    label: '等张模式 (IsoT)',
    paramLabel: '测试阻力',
    paramUnit: 'kg',
    metrics: [
      { key: 'con_speed_max', label: '最大速度', unit: 'mm/s' },
      { key: 'con_speed_avg', label: '平均速度', unit: 'mm/s' },
      { key: 'con_power_max', label: '最大功率', unit: 'W' },
      { key: 'con_power_avg', label: '平均功率', unit: 'W' },
      { key: 'rel_con_power_max', label: '相对最大功率', unit: 'W/kg' },
    ]
  },
  isometric: {
    id: 3,
    label: '等长模式 (IsoM)',
    paramLabel: '测试位置',
    paramUnit: '°',
    metrics: [
      { key: 'con_stre_max', label: '最大力量', unit: 'kg' },
      { key: 'con_stre_avg', label: '平均力量', unit: 'kg' },
      { key: 'rel_con_stre_max', label: '相对最大力量', unit: 'kg/kg' },
      { key: 'rel_con_stre_avg', label: '相对平均力量', unit: 'kg/kg' },
    ]
  }
};

// 部位图标映射函数
const getJointIcon = (jointName) => {
  if (!jointName) return <Footprints size={16} color="rgba(255,255,255,0.6)" />;
  if (jointName.includes('左')) return <ArrowLeftToLine size={16} color="#fb923c" title="左侧" />;   
  if (jointName.includes('右')) return <ArrowRightToLine size={16} color="#4ade80" title="右侧" />;  
  if (jointName.includes('双')) return <Columns size={16} color="#60a5fa" title="双侧" />;           
  return <Footprints size={16} color="rgba(255,255,255,0.6)" />;
};

const Ranking = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('isokinetic');
  const [activeMetricIdx, setActiveMetricIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [rankingData, setRankingData] = useState([]);
  const [loading, setLoading] = useState(false);
  const pageSize = 10;

  const currentMode = METRIC_CONFIG[activeTab];
  const currentMetric = currentMode.metrics[activeMetricIdx];

  // 这里的 useEffect 负责从后端抓取真实数据
  useEffect(() => {
    const fetchRanking = async () => {
      setLoading(true);
      try {
        const data = await trainApi.getRanking({
          typeId: currentMode.id,
          metric: currentMetric.key,
          limit: 100 // 全局取前 100 名
        });
        setRankingData(data || []);
      } catch (error) {
        console.error('获取排行榜失败:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchRanking();
  }, [activeTab, activeMetricIdx]);

  // 分页截取
  const currentData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return rankingData.slice(start, start + pageSize);
  }, [rankingData, currentPage]);

  const onPageChange = (newPage) => {
    setCurrentPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="page-container" style={{ 
      animation: 'fadeIn 0.5s ease-out',
      background: 'radial-gradient(circle at center, rgba(30, 41, 59, 0.4), transparent)',
      minHeight: '100vh',
      paddingBottom: '80px',
      maxWidth: '1400px',
      margin: '0 auto',
      position: 'relative'
    }}>
      {/* 标题 */}
      <div style={{ textAlign: 'center', marginBottom: '60px', paddingTop: '40px', position: 'relative', zIndex: 1 }}>
        <h1 style={{ fontSize: '40px', fontWeight: '900', color: '#fff', margin: 0, letterSpacing: '6px', textTransform: 'uppercase' }}>
          测试数据排行榜
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.3)', marginTop: '8px', fontSize: '12px', letterSpacing: '4px' }}>TRAINING PERFORMANCE RANKBOARD</p>
      </div>

      {/* 过滤区 */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '80px', position: 'relative', zIndex: 1 }}>
        <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: '6px', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.05)' }}>
          {Object.keys(METRIC_CONFIG).map(key => (
            <button 
              key={key}
              onClick={() => { setActiveTab(key); setActiveMetricIdx(0); setCurrentPage(1); }}
              style={{
                padding: '8px 20px', borderRadius: '8px', border: 'none',
                background: activeTab === key ? 'var(--primary-color)' : 'transparent',
                color: activeTab === key ? '#fff' : 'rgba(255,255,255,0.5)',
                fontWeight: '700', cursor: 'pointer', transition: 'all 0.3s ease', fontSize: '14px'
              }}
            >
              {METRIC_CONFIG[key].label}
            </button>
          ))}
        </div>
        
        <div style={{ position: 'relative' }}>
          <select 
            value={activeMetricIdx}
            onChange={(e) => { setActiveMetricIdx(parseInt(e.target.value)); setCurrentPage(1); }}
            style={{
              appearance: 'none', background: 'rgba(59, 130, 246, 0.1)', border: '1px solid rgba(59, 130, 246, 0.3)',
              color: 'var(--primary-light)', fontSize: '16px', fontWeight: '800', padding: '10px 40px 10px 20px',
              borderRadius: '10px', cursor: 'pointer', outline: 'none'
            }}
          >
            {currentMode.metrics.map((m, i) => (
              <option key={m.key} value={i} style={{ background: '#0a0a0c', color: '#fff' }}>{m.label}</option>
            ))}
          </select>
          <ChevronDown size={16} style={{ position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--primary-light)' }} />
        </div>
      </div>

      {/* 领奖台 (全局前三) */}
      <div id="podium-section" style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-end', gap: '12px', marginBottom: '100px', paddingTop: '40px', minHeight: '460px' }}>
        {rankingData.length > 0 ? (
          [
            { item: rankingData[1], rank: 2, label: "SILVER", color: "#cbd5e1", className: "silver" },   // 左侧亚军
            { item: rankingData[0], rank: 1, label: "CHAMPION", color: "#fbbf24", className: "gold" }, // 中间冠军
            { item: rankingData[2], rank: 3, label: "BRONZE", color: "#d97706", className: "bronze" }  // 右侧季军
          ].map(({ item, rank, label, color, className }, i) => {
            if (!item) return <div key={i} style={{ width: '240px' }} />;
            
            return (
              <div key={item.recordId} className={`stepped-podium rank-${rank}`} 
                style={{ animation: `fadeInUp 0.6s ease-out ${rank*0.2}s both`, cursor: 'pointer' }}
                onClick={() => navigate(`/train-detail/${item.recordId}`)}
              >
                <div className={`podium-cap ${className}`}></div>
                <div className="content">
                  {rank === 1 && <Trophy size={40} color="#fbbf24" className="floating-trophy" />}
                  <div className={`rank-label ${className}`}>{label}</div>
                  <div className={`avatar-wrapper ${className}`}>
                    <User size={rank===1?48:32} color={color} />
                  </div>
                  <div className="info">
                    <div className={`name ${rank===1?'gold':''}`}>{item.name}</div>
                    <div className={`score ${className}`}>{Number(item.score).toFixed(2)}<span className="unit">{currentMetric.unit}</span></div>
                  </div>
                </div>
                <div className="base-number">{rank}</div>
                {rank === 1 && <div className="crown-light"></div>}
              </div>
            );
          })
        ) : (
          <div style={{ color: 'rgba(255,255,255,0.2)' }}>暂无排名数据</div>
        )}
      </div>

      {/* 列表 */}
      <div style={{ padding: '0 80px', marginBottom: '40px', opacity: loading ? 0.5 : 1, transition: '0.3s' }}>
        <div style={{ display: 'grid', gap: '12px' }}>
          {currentData.map((item, index) => {
            const globalRank = (currentPage - 1) * pageSize + index + 1;
            return (
              <div key={`${item.recordId}-${index}`} className="rich-rank-card" onClick={() => navigate(`/train-detail/${item.recordId}`)}>
                <div className="card-section info-section">
                  <div className={`rank-badge-v3 ${globalRank <= 3 ? 'top' : ''}`}>{globalRank}</div>
                  <div className="user-details">
                    <div className="name">{item.name}</div>
                    <div className="meta">
                      <span className="group">{item.group}</span>
                      <span className="dot">•</span>
                      <span className="time">{new Date(item.time).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="card-section config-section">
                  <div className="config-grid">
                    <div className="config-item">
                        <span className="icon">{getJointIcon(item.joint)}</span>
                        <div className="text">
                           <label>测试部位</label>
                           <span>{item.joint || '--'}</span>
                        </div>
                    </div>
                    <div className="config-item">
                        <span className="icon"><Move size={14} /></span>
                        <div className="text">
                           <label>活动范围</label>
                           <span>{item.cfg_roma}° - {item.cfg_romb}°</span>
                        </div>
                    </div>
                    <div className="config-item highlight">
                        <span className="icon">
                            {activeTab === 'isokinetic' && <Timer size={14} />}
                            {activeTab === 'isotonic' && <Scale size={14} />}
                            {activeTab === 'isometric' && <Navigation size={14} />}
                        </span>
                        <div className="text">
                           <label>{currentMode.paramLabel}</label>
                           <span className="param-val">
                             {activeTab === 'isokinetic' ? item.cfg_con_speed : activeTab === 'isotonic' ? item.cfg_stre : item.cfg_pos} 
                             <small>{currentMode.paramUnit}</small>
                           </span>
                        </div>
                    </div>
                  </div>
                </div>

                <div className="card-section core-metric-section">
                   <div className="label-row">
                      <span className="metric-name">{currentMetric.label}</span>
                   </div>
                   <div className="value-row">
                      {Number(item.score).toFixed(2)}<small>{currentMetric.unit}</small>
                   </div>
                </div>

                <div className="action-section">
                    <div className="detail-circle"><ExternalLink size={18} /></div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <Pagination total={rankingData.length} page={currentPage} pageSize={pageSize} onPageChange={onPageChange} />

      <style>{`
        .stepped-podium { position: relative; width: 240px; background: linear-gradient(180deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.01) 100%); border: 1px solid rgba(255,255,255,0.1); border-bottom: none; border-radius: 20px 20px 0 0; backdrop-filter: blur(12px); display: flex; flex-direction: column; align-items: center; padding: 30px 20px; transition: 0.3s; }
        .rank-1 { height: 420px; z-index: 3; background: linear-gradient(180deg, rgba(251, 191, 36, 0.1) 0%, rgba(255,255,255,0.01) 100%); border-color: rgba(251, 191, 36, 0.3); }
        .rank-2 { height: 350px; z-index: 2; border-color: rgba(203, 213, 225, 0.2); }
        .rank-3 { height: 300px; z-index: 1; border-color: rgba(217, 119, 6, 0.2); }
        .content { display: flex; flex-direction: column; align-items: center; text-align: center; width: 100%; position: relative; z-index: 2; }
        .podium-cap { position: absolute; top: 0; left: 0; right: 0; height: 4px; border-radius: 20px 20px 0 0; }
        .podium-cap.gold { background: #fbbf24; }
        .podium-cap.silver { background: #cbd5e1; }
        .podium-cap.bronze { background: #d97706; }
        .rank-label { font-size: 10px; font-weight: 900; letter-spacing: 2px; padding: 4px 12px; border-radius: 10px; margin-bottom: 20px; background: rgba(255,255,255,0.08); }
        .rank-label.gold { color: #fbbf24; }
        .avatar-wrapper { width: 80px; height: 80px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 2px solid rgba(255,255,255,0.1); margin-bottom: 20px; }
        .avatar-wrapper.gold { width: 100px; height: 100px; border-color: #fbbf24; }
        .score { font-size: 32px; font-weight: 900; font-family: monospace; }
        .score.gold { font-size: 42px; color: #fbbf24; }
        .score .unit { font-size: 14px; opacity: 0.5; margin-left: 4px; color: #fff; }
        .base-number { position: absolute; bottom: -20px; left: 50%; transform: translateX(-50%); font-size: 120px; font-weight: 900; color: rgba(255,255,255,0.03); z-index: 1; pointer-events: none; }
        .floating-trophy { filter: drop-shadow(0 0 15px rgba(251, 191, 36, 0.6)); animation: float 3s ease-in-out infinite; margin-bottom: 15px; }
        @keyframes fadeInUp { from { opacity: 0; transform: translateY(40px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes float { 0% , 100% { transform: translateY(0); } 50% { transform: translateY(-10px); } }

        .rich-rank-card {
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 16px;
          padding: 16px 24px;
          display: flex;
          align-items: center;
          gap: 24px;
          transition: 0.2s;
          cursor: pointer;
        }
        .rich-rank-card:hover { background: rgba(255, 255, 255, 0.12); border-color: var(--primary-color); transform: translateX(6px); }

        .card-section { display: flex; flex-direction: column; }
        .info-section { flex: 1.2; flex-direction: row !important; align-items: center !important; gap: 20px !important; }

        .rank-badge-v3 { width: 38px; height: 38px; border-radius: 10px; background: rgba(255,255,255,0.06); display: flex; align-items: center; justify-content: center; font-family: monospace; font-size: 18px; font-weight: 900; color: rgba(255,255,255,0.2); flex-shrink: 0; }
        .rank-badge-v3.top { background: var(--primary-color); color: #fff; box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3); }

        .user-details .name { font-size: 18px; font-weight: 800; color: #fff; margin-bottom: 2px; }
        .user-details .meta { font-size: 12px; color: rgba(255,255,255,0.4); display: flex; align-items: center; gap: 8px; }
        .user-details .group { color: var(--primary-light); }
        .user-details .dot { opacity: 0.3; }

        .config-grid { display: grid; grid-template-columns: 1fr 1fr 1.2fr; gap: 16px; padding: 0 24px; border-left: 1px solid rgba(255,255,255,0.08); border-right: 1px solid rgba(255,255,255,0.08); }
        .config-item { display: flex; align-items: center; gap: 12px; }
        .config-item .icon { color: rgba(255,255,255,0.7); display: flex; align-items: center; }
        .config-item .text { display: flex; flex-direction: column; }
        .config-item label { font-size: 10px; color: rgba(255,255,255,0.4); text-transform: uppercase; margin-bottom: 2px; }
        .config-item span { font-size: 14px; font-weight: 700; color: #fff; }
        .config-item.highlight .icon { color: var(--primary-light); transform: scale(1.1); filter: drop-shadow(0 0 5px rgba(59, 130, 246, 0.4)); }
        .config-item.highlight .param-val { color: var(--primary-light); font-family: monospace; font-size: 16px; }
        .config-item.highlight .param-val small { font-size: 10px; font-weight: 400; opacity: 0.7; }

        .core-metric-section { flex: 1.2; text-align: right; }
        .core-metric-section .label-row { display: flex; align-items: center; justify-content: flex-end; gap: 10px; margin-bottom: 4px; }
        .core-metric-section .metric-name { font-size: 12px; color: rgba(255,255,255,0.4); }
        .value-row { font-size: 32px; font-weight: 900; color: #fff; font-family: monospace; line-height: 1; }
        .value-row small { font-size: 14px; margin-left: 4px; opacity: 0.4; font-weight: 400; font-family: sans-serif; }

        .detail-circle { width: 44px; height: 44px; border-radius: 50%; background: rgba(255,255,255,0.04); color: rgba(255,255,255,0.2); display: flex; align-items: center; justify-content: center; transition: 0.2s; }
        .rich-rank-card:hover .detail-circle { background: var(--primary-color); color: #fff; box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4); }
      `}</style>
    </div>
  );
};

export default Ranking;
