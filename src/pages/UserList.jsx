import React, { useState, useEffect, useCallback } from 'react';
import { Search, Filter, UserPlus, ChevronRight, User, Hash, UserCircle } from 'lucide-react';
import { userApi, commonApi } from '../services/api';
import Pagination from '../components/Pagination';

const UserList = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);
  const pageSize = 12;

  // 搜索与筛选状态
  const [searchName, setSearchName] = useState('');
  const [searchId, setSearchId] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('all');
  const [groups, setGroups] = useState([]);

  // 加载初始数据（组别列表）
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const data = await commonApi.getGroups();
        setGroups(data || []);
      } catch (err) {
        console.error('加载组别失败:', err);
      }
    };
    fetchGroups();
  }, []);

  // 获取用户列表逻辑
  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await userApi.getAll({ 
        page: currentPage, 
        pageSize,
        name: searchName,
        userId: searchId,
        groupId: selectedGroup
      });
      setUsers(res.data || []);
      setTotal(res.total || 0);
    } catch (error) {
      console.error('获取用户失败:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchName, searchId, selectedGroup]);

  // 当筛选条件或页码改变时重新加载
  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // 重置页码执行搜索（当搜索条件变化时）
  useEffect(() => {
    setCurrentPage(1);
  }, [searchName, searchId, selectedGroup]);

  return (
    <div className="page-container" style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <div>
          <h2 style={{ margin: 0 }}>用户花名册</h2>
          <p style={{ color: 'var(--text-muted)', margin: '4px 0 0 0', fontSize: '14px' }}>全系统共计 {total} 名运动员</p>
        </div>
        <button className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <UserPlus size={18} />
          <span>录入运动员</span>
        </button>
      </div>

      {/* 搜索与筛选区 */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '32px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <UserCircle size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
          <input 
            type="text" 
            placeholder="搜索姓名..." 
            value={searchName}
            onChange={(e) => setSearchName(e.target.value)}
            style={{ paddingLeft: '48px' }} 
          />
        </div>
        
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <Hash size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
          <input 
            type="text" 
            placeholder="按运动员 ID 查找..." 
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            style={{ paddingLeft: '48px' }} 
          />
        </div>

        <div style={{ width: '200px', position: 'relative' }}>
          <Filter size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
          <select 
            value={selectedGroup}
            onChange={(e) => setSelectedGroup(e.target.value)}
            style={{ paddingLeft: '48px' }}
          >
            <option value="all">所有组别</option>
            {groups.map(g => (
              <option key={g.id} value={g.id}>{g.name}</option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '100px', color: 'var(--text-muted)' }}>加载数据中...</div>
      ) : (
        <>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '24px' }}>
            {users.map(user => (
              <div key={user.id} className="card user-card" style={{ padding: '24px', transition: 'all 0.3s' }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ 
                    width: '64px', 
                    height: '64px', 
                    borderRadius: '16px', 
                    background: user.gender === '男' 
                      ? 'rgba(0, 122, 255, 0.15)' 
                      : user.gender === '女' 
                        ? 'rgba(255, 45, 85, 0.15)' 
                        : 'var(--bg-tertiary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    border: user.gender === '男' 
                      ? '1px solid rgba(0, 122, 255, 0.3)' 
                      : user.gender === '女' 
                        ? '1px solid rgba(255, 45, 85, 0.3)' 
                        : '1px solid rgba(255, 255, 255, 0.05)',
                    boxShadow: user.gender === '男' 
                      ? '0 0 15px rgba(0, 122, 255, 0.1)' 
                      : user.gender === '女' 
                        ? '0 0 15px rgba(255, 45, 85, 0.1)' 
                        : 'none'
                  }}>
                    <User 
                      size={32} 
                      color={user.gender === '男' ? '#007AFF' : user.gender === '女' ? '#FF2D55' : 'var(--primary-color)'} 
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                      <h4 style={{ margin: 0, fontSize: '18px' }}>{user.name}</h4>
                      <span style={{ 
                        fontSize: '11px', 
                        padding: '2px 8px', 
                        borderRadius: '6px', 
                        background: user.gender === '男' ? '#007AFF' : '#FF2D55',
                        color: '#FFFFFF',
                        fontWeight: '700',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)'
                      }}>
                        {user.gender || '未知'}
                      </span>
                    </div>
                    <span className="role-badge user" style={{ fontSize: '12px' }}>
                      {user.group_name || '未分配组别'}
                    </span>
                  </div>
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>ID: <span style={{ color: 'var(--text-primary)', fontWeight: '600' }}>{user.id}</span></div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>年龄: <span style={{ color: 'var(--text-primary)' }}>{user.age || '--'}岁</span></div>
                  <div style={{ fontSize: '13px', color: 'var(--text-muted)' }}>身高: <span style={{ color: 'var(--text-primary)' }}>{user.height || '--'}cm</span></div>
                  <div style={{ fontSize: '13px', color: 'var(--text-primary)' }}>体重: <span style={{ color: 'var(--text-primary)' }}>{user.weight || '--'}kg</span></div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '16px' }}>
                  <button 
                    className="btn btn-secondary btn-sm" 
                    style={{ padding: '8px 16px', width: '100%', justifyContent: 'center' }}
                    onClick={() => window.location.href = `/user-summary/${user.id}`}
                  >
                    <span>查看完整档案</span>
                    <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>

          <Pagination 
            total={total} 
            page={currentPage} 
            pageSize={pageSize} 
            onPageChange={setCurrentPage} 
          />
        </>
      )}
    </div>
  );
};

export default UserList;
