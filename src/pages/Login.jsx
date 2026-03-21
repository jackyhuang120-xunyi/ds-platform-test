import React, { useState } from 'react';
import { Lock, User, Eye, EyeOff, CheckCircle2 } from 'lucide-react';

import { authApi } from '../services/api';

const Login = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('123456');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      const res = await authApi.login(username, password);
      if (res.success && res.token) {
        localStorage.setItem('token', res.token);
        window.location.href = '/dashboard';
      } else {
        setError(res.message || '登录失败');
      }
    } catch (err) {
      setError(err.response?.data?.message || '服务器连接失败');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ 
      height: '100vh', width: '100vw', 
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--bg-gradient)',
      position: 'fixed', top: 0, left: 0, zIndex: 2000
    }}>
      <div className="card" style={{ 
        width: '100%', maxWidth: '420px', padding: '48px', 
        textAlign: 'center', boxShadow: 'var(--shadow-large)',
        animation: 'zoomIn 0.6s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
      }}>
        <div style={{ 
          width: '72px', height: '72px', background: 'var(--gradient-primary)',
          borderRadius: '20px', margin: '0 auto 24px',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: 'var(--shadow-glow)'
        }}>
          <CheckCircle2 size={40} color="#fff" />
        </div>
        
        <h1 style={{ fontSize: '28px', marginBottom: '8px', background: 'var(--gradient-primary)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          DS PLATFORM
        </h1>
        <p style={{ color: 'var(--text-muted)', marginBottom: '40px' }}>体能数据管理平台控制台</p>

        {error && (
          <div style={{ color: '#ff4d4f', background: 'rgba(255,77,79,0.1)', padding: '8px 12px', borderRadius: '4px', marginBottom: '16px', fontSize: '14px', textAlign: 'center' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} style={{ textAlign: 'left' }}>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>账号 / 手机号</label>
            <div style={{ position: 'relative' }}>
              <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
              <input 
                type="text" 
                placeholder="请输入您的账号" 
                style={{ paddingLeft: '48px' }}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '32px' }}>
            <label style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>安全密码</label>
            <div style={{ position: 'relative' }}>
              <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="请输入密码" 
                style={{ paddingLeft: '48px' }}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <div 
                onClick={() => setShowPassword(!showPassword)}
                style={{ position: 'absolute', right: '16px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', color: 'var(--text-disabled)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </div>
            </div>
          </div>

          <button type="submit" className="btn btn-primary" style={{ width: '100%', padding: '14px', fontSize: '16px' }}>
            {isLoading ? '正在登录...' : '安全登录'}
          </button>
        </form>

        <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'center', gap: '16px', fontSize: '14px', color: 'var(--text-muted)' }}>
          <span style={{ cursor: 'pointer' }}>忘记密码？</span>
          <span style={{ color: 'rgba(255,255,255,0.1)' }}>|</span>
          <span style={{ cursor: 'pointer' }}>注册账号</span>
        </div>
      </div>

      <style>{`
        @keyframes zoomIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
};

export default Login;
