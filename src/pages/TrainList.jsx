import React, { useState, useEffect } from 'react';
import { Search, Filter, Calendar, Download, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { trainApi } from '../services/api';
import { format } from 'date-fns';
import Pagination from '../components/Pagination';

const TrainList = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [sortConfig, setSortConfig] = useState({ key: 'time', direction: 'desc' });
  const [metadata, setMetadata] = useState({ groups: [], types: [], parts: [] });
  const [filters, setFilters] = useState({
    uid: '',
    userName: '',
    groupId: 'all',
    typeId: 'all',
    partId: 'all',
    startDate: '',
    endDate: ''
  });
  const pageSize = 12;

  // 获取记录 (移除多余的参数传递，直接使用 filters 状态)
  const fetchRecords = async (currentFilters = filters) => {
    try {
      setLoading(true);
      const res = await trainApi.getRecords({ 
        page: currentPage, 
        pageSize,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction,
        ...currentFilters 
      });
      setRecords(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取记录失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 初始化加载元数据
  useEffect(() => {
    const initData = async () => {
      try {
        const metaRes = await trainApi.getMetadata();
        setMetadata(metaRes || { groups: [], types: [], parts: [] });
      } catch (err) {
        console.warn('动态加载元数据失败，使用降级数据');
        setMetadata({
          groups: Array.from({ length: 10 }, (_, i) => ({ id: i + 1, name: `${i + 1}组` })),
          types: [{ id: 1, name: '等速测试' }, { id: 2, name: '等张测试' }, { id: 3, name: '等长测试' }],
          parts: [{ id: 1, name: '双腿' }, { id: 2, name: '左腿' }, { id: 3, name: '右腿' }]
        });
      }
    };
    initData();
  }, []);

  // 用于防抖的计时器引用
  const debounceTimer = React.useRef(null);

  // 监听筛选条件变化执行即时搜索
  useEffect(() => {
    // 文本类筛选使用防抖，下拉和日期直接触发
    const isTextInput = filters.uid || filters.userName;
    
    // 清除上一个计时器
    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    debounceTimer.current = setTimeout(() => {
      setCurrentPage(1);
      fetchRecords();
    }, isTextInput ? 500 : 50); // 下拉等操作给极短延迟以平滑状态流，文本给 500ms

    return () => clearTimeout(debounceTimer.current);
  }, [filters.uid, filters.userName, filters.groupId, filters.typeId, filters.partId, filters.startDate, filters.endDate]);

  // 分页或排序变更监听
  useEffect(() => {
    fetchRecords();
  }, [currentPage, sortConfig]);

  // 当训练类型变回“所有”时，如果当前正在排配置列，自动切回时间排序
  useEffect(() => {
    if (filters.typeId === 'all' && sortConfig.key === 'config_value') {
      setSortConfig({ key: 'time', direction: 'desc' });
    }
  }, [filters.typeId]);

  const handleReset = () => {
    const resetFilters = { 
      uid: '', 
      userName: '', 
      groupId: 'all', 
      typeId: 'all', 
      partId: 'all', 
      startDate: '', 
      endDate: '' 
    };
    setFilters(resetFilters);
    setCurrentPage(1);
    // 注意：setFilters 会触发上面的即时搜索 useEffect
  };

  const toggleSelect = (record) => {
    const id = record.id;
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter(i => i !== id));
    } else {
      // 核心约束：同类型运动校验
      if (selectedIds.length > 0) {
        // 查找当前已选记录的类型 (从 records 状态中找)
        const firstSelected = records.find(r => r.id === selectedIds[0]);
        if (firstSelected && firstSelected.type_id !== record.type_id) {
          alert(`对比失败：只能对比相同类型的运动。请选择“${firstSelected.type_name}”记录。`);
          return;
        }
      }
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // 排序切换时重置到第一页
  };

  const isConfigSortEnabled = filters.typeId !== 'all';

  const renderSortIcon = (key) => {
    if (key === 'config_value' && !isConfigSortEnabled) return null;
    if (sortConfig.key !== key) return <ArrowUpDown size={14} style={{ marginLeft: '4px', opacity: 0.3 }} />;
    return sortConfig.direction === 'asc' ? 
      <ArrowUp size={14} style={{ marginLeft: '4px', color: 'var(--primary-color)' }} /> : 
      <ArrowDown size={14} style={{ marginLeft: '4px', color: 'var(--primary-color)' }} />;
  };

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <h2 style={{ margin: 0 }}>训练记录大厅</h2>
        <button className="btn btn-secondary btn-sm" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Download size={18} />
          <span>批量导出</span>
        </button>
      </div>

      {/* 高级筛选器区域 */}
      <div style={{ 
        background: 'rgba(255,255,255,0.03)', 
        padding: '24px', 
        borderRadius: '16px', 
        marginBottom: '32px',
        border: '1px solid rgba(255,255,255,0.05)'
      }}>
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', 
          gap: '20px',
          alignItems: 'end'
        }}>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>用户ID</label>
            <input 
              type="text" 
              placeholder="精确匹配" 
              value={filters.uid}
              onChange={e => setFilters({...filters, uid: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>用户名</label>
            <input 
              type="text" 
              placeholder="模糊匹配" 
              value={filters.userName}
              onChange={e => setFilters({...filters, userName: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>组别</label>
            <select value={filters.groupId} onChange={e => setFilters({...filters, groupId: e.target.value})}>
              <option value="all">所有组别</option>
              {metadata.groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>训练类型</label>
            <select value={filters.typeId} onChange={e => setFilters({...filters, typeId: e.target.value})}>
              <option value="all">所有类型</option>
              {metadata.types.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>测试部位</label>
            <select value={filters.partId} onChange={e => setFilters({...filters, partId: e.target.value})}>
              <option value="all">所有部位</option>
              {metadata.parts.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>起始日期</label>
            <input 
              type="date" 
              value={filters.startDate}
              onChange={e => setFilters({...filters, startDate: e.target.value})}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px' }}>结束日期</label>
            <input 
              type="date" 
              value={filters.endDate}
              onChange={e => setFilters({...filters, endDate: e.target.value})}
            />
          </div>
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', marginTop: '8px', minWidth: 'max-content' }}>
            <button className="btn btn-primary" style={{ padding: '10px 32px', minWidth: '120px', whiteSpace: 'nowrap' }} onClick={() => { setCurrentPage(1); fetchRecords(); }}>
              <Search size={18} style={{ marginRight: '8px', verticalAlign: 'middle' }} />
              搜索
            </button>
            <button 
              className="btn btn-secondary" 
              style={{ minWidth: '100px' }} 
              onClick={handleReset}
            >
              重置
            </button>
            
            {/* 集成对比操作按钮 */}
            {selectedIds.length >= 2 && (
              <button 
                className="btn"
                style={{ 
                  background: 'var(--primary-color)', 
                  color: '#fff', 
                  minWidth: '160px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  animation: 'fadeIn 0.3s ease-out'
                }}
                onClick={() => {
                  const ids = selectedIds.join(',');
                  window.location.href = `/comparison?ids=${ids}`;
                }}
              >
                <ArrowUpDown size={18} />
                <span>开启对比 ({selectedIds.length})</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 表格 */}
      <div className="data-table-container">
        {loading ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>加载中...</div>
        ) : records.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-secondary)' }}>暂无符合条件的筛选记录</div>
        ) : (
          <table>
          <thead>
            <tr>
              <th style={{ width: '40px' }}><input type="checkbox" /></th>
              <th>训练ID</th>
              <th onClick={() => handleSort('uid')} style={{ cursor: 'pointer' }}>
                用户ID {renderSortIcon('uid')}
              </th>
              <th onClick={() => handleSort('type_name')} style={{ cursor: 'pointer' }}>
                训练类型 {renderSortIcon('type_name')}
              </th>
              <th onClick={() => handleSort('time')} style={{ cursor: 'pointer' }}>
                开始时间 {renderSortIcon('time')}
              </th>
              <th 
                onClick={() => isConfigSortEnabled && handleSort('config_value')} 
                style={{ 
                  cursor: isConfigSortEnabled ? 'pointer' : 'not-allowed',
                  color: isConfigSortEnabled ? 'inherit' : 'var(--text-disabled)',
                  opacity: isConfigSortEnabled ? 1 : 0.6
                }}
                title={isConfigSortEnabled ? '点击排序' : '请先选择具体训练类型以开启排序'}
              >
                配置信息 {renderSortIcon('config_value')}
              </th>
              <th>组别</th>
              <th>部位</th>
              <th>组数</th>
              <th>休息<br/>时间<span style={{ fontSize: '14px', opacity: 0.8 }}>(s)</span></th>
              <th onClick={() => handleSort('con_stre_max')} style={{ cursor: 'pointer' }}>
                向心峰值<br/>力量<span style={{ fontSize: '14px', opacity: 0.8 }}>(kg)</span> {renderSortIcon('con_stre_max')}
              </th>
              <th style={{ verticalAlign: 'middle' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {records.map(record => {
              // 配置信息格式化逻辑
              let configInfo = '--';
              if (record.type_id === 1) configInfo = `${record.cfg_con_speed || 0}mm/s`;
              else if (record.type_id === 2) configInfo = `${record.cfg_stre || 0}kg`;
              else if (record.type_id === 3) configInfo = `${record.cfg_pos || 0}mm`;

              return (
                <tr key={record.id} className={selectedIds.includes(record.id) ? 'selected-row' : ''}>
                  <td>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(record.id)}
                      onChange={() => toggleSelect(record)}
                    />
                  </td>
                  <td style={{ fontWeight: '600', color: 'var(--primary-color)' }}>{record.id}</td>
                  <td>
                    <span style={{ fontWeight: '600' }}>{record.uid}</span>
                    <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>({record.user_name})</span>
                  </td>
                  <td>
                    <span 
                      className="badge-premium" 
                      style={{ 
                        '--tag-color': record.type_id === 1 ? '#007aff' : 
                                      record.type_id === 2 ? '#ff9500' : 
                                      record.type_id === 3 ? '#af52de' : '#8e8e93',
                        background: record.type_id === 1 ? '#007aff' : 
                                    record.type_id === 2 ? '#ff9500' : 
                                    record.type_id === 3 ? '#af52de' : '#8e8e93',
                        color: '#fff',
                        border: 'none',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                        padding: '4px 12px',
                        textShadow: '0 1px 2px rgba(0,0,0,0.2)'
                      }}
                    >
                      <span className="badge-dot" style={{ background: '#fff' }}></span>
                      <span style={{ position: 'relative', zIndex: 1 }}>{record.type_name}</span>
                    </span>
                  </td>
                  <td style={{ color: 'var(--text-secondary)' }}>
                    {record.time ? format(new Date(record.time), 'yyyy-MM-dd HH:mm') : '--'}
                  </td>
                  <td style={{ verticalAlign: 'middle' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>
                        {record.type_id === 1 ? (record.cfg_con_speed || 0) :
                          record.type_id === 2 ? (record.cfg_stre || 0) :
                            record.type_id === 3 ? (record.cfg_pos || 0) : '--'}
                      </span>
                      {record.type_id === 1 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(0, 122, 255, 0.25)', color: '#58a6ff', border: '1px solid rgba(0, 122, 255, 0.4)', fontWeight: '700' }}>mm/s</span>}
                      {record.type_id === 2 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(255, 159, 10, 0.25)', color: '#ff9f0a', border: '1px solid rgba(255, 159, 10, 0.4)', fontWeight: '700' }}>kg</span>}
                      {record.type_id === 3 && <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '12px', background: 'rgba(191, 90, 242, 0.25)', color: '#bf5af2', border: '1px solid rgba(191, 90, 242, 0.4)', fontWeight: '700' }}>mm</span>}
                    </div>
                  </td>
                  <td>{record.group_name}</td>
                  <td>{record.part_name}</td>
                  <td style={{ fontWeight: '600' }}>{record.cfg_group || '--'}</td>
                  <td style={{ fontWeight: '600' }}>{record.cfg_rest_time || '--'}</td>
                  <td style={{ fontWeight: '700' }}>{record.con_stre_max || '--'}</td>
                  <td>
                    <button
                      className="btn-details-neon"
                      onClick={() => window.location.href = `/train-detail/${record.id}`}
                    >
                      <span>详情</span>
                      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        )}
      </div>

      <Pagination
        total={total}
        page={currentPage}
        pageSize={pageSize}
        onPageChange={setCurrentPage}
      />

      <style>{`
        .selected-row { background: rgba(0, 122, 255, 0.05) !important; }
        
        .data-table-container {
          width: 100%;
          overflow-x: auto;
          background: rgba(255, 255, 255, 0.02);
          border-radius: 16px;
          border: 1px solid rgba(255, 255, 255, 0.05);
        }

        table {
          width: 100%;
          border-collapse: collapse;
          table-layout: auto;
        }

        th, td {
          padding: 18px 20px;
          text-align: left;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
          font-size: 16px;
          vertical-align: middle; /* 确保换行后内容垂直居中 */
        }

        td {
          white-space: nowrap; /* 数据行保持不换行 */
        }

        th {
          white-space: normal; /* 标题行允许手动换行 */
          line-height: 1.4;
          font-weight: 800; /* 加重表头字骨骼 */
          color: var(--text-primary); /* 使用更亮的文字颜色 */
          background: rgba(255, 255, 255, 0.05); /* 稍微加深背景 */
          font-size: 18px; /* 标题上调至 18px */
          letter-spacing: 1px;
        }

        .badge-premium {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 13px;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          position: relative;
          overflow: hidden;
          transition: all 0.3s cubic-bezier(0.23, 1, 0.32, 1);
          cursor: default;
        }

        .badge-premium:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 15px var(--tag-color) !important;
          filter: brightness(1.2);
        }

        .badge-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          box-shadow: 0 0 8px currentColor;
          display: inline-block;
        }

        .btn-details-neon {
          background: rgba(0, 122, 255, 0.1);
          color: #58a6ff;
          border: 1px solid rgba(0, 122, 255, 0.4);
          padding: 6px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.3s ease;
          backdrop-filter: blur(4px);
        }

        .btn-details-neon:hover {
          background: var(--primary-color);
          color: white;
          box-shadow: 0 0 15px rgba(0, 122, 255, 0.5);
          transform: translateY(-1px);
          border-color: transparent;
        }

        .btn-details-neon active {
          transform: translateY(0);
        }

        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, 20px); }
          to { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>
    </div>
  );
};

export default TrainList;
