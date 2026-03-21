import React from 'react';
import { useNavigate, NavLink } from 'react-router-dom';
import { LayoutDashboard, List, Trophy, Users, LogOut, User } from 'lucide-react';

const Navbar = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login', { replace: true });
  };
  return (
    <header className="app-header">
      <div className="header-left">
        <h1>DS PLATFORM</h1>
        <p>体能数据管理平台</p>
      </div>
      <nav className="nav">
        <NavLink to="/dashboard" className={({ isActive }) => (isActive ? 'active' : '')}>
          <LayoutDashboard size={18} style={{ marginRight: '8px' }} />
          概览
        </NavLink>
        <NavLink to="/train-list" className={({ isActive }) => (isActive ? 'active' : '')}>
          <List size={18} style={{ marginRight: '8px' }} />
          训练
        </NavLink>
        <NavLink to="/ranking" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Trophy size={18} style={{ marginRight: '8px' }} />
          排行
        </NavLink>
        <NavLink to="/user-list" className={({ isActive }) => (isActive ? 'active' : '')}>
          <Users size={18} style={{ marginRight: '8px' }} />
          用户
        </NavLink>
        <div style={{ width: '1px', height: '24px', background: 'rgba(255,255,255,0.1)', margin: '0 16px' }}></div>
        <NavLink to="/user-summary/me" className={({ isActive }) => (isActive ? 'active' : '')}>
          <User size={18} style={{ marginRight: '8px' }} />
          我的
        </NavLink>
        <button 
          className="nav-btn" 
          onClick={handleLogout}
          style={{ marginLeft: '8px', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
        >
          <LogOut size={18} />
        </button>
      </nav>
    </header>
  );
};

export default Navbar;
