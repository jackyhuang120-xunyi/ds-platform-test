import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, User, Hash, Phone, Ruler, Weight, Calendar, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';
import { userApi, commonApi } from '../services/api';

const CreateUserModal = ({ isOpen, onClose, onSuccess }) => {
    const [formData, setFormData] = useState({
        name: '',
        gender: 1, // 默认男
        birthday: '', // 改为生日
        height: '',
        weight: '',
        group: '',
        phone: '',
        id_number: '',
        remark: ''
    });

    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);

    useEffect(() => {
        if (isOpen) {
            fetchGroups();
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => { document.body.style.overflow = 'auto'; };
    }, [isOpen]);

    const fetchGroups = async () => {
        try {
            const data = await commonApi.getGroups();
            setGroups(data || []);
            if (data && data.length > 0 && !formData.group) {
                setFormData(prev => ({ ...prev, group: data[0].id }));
            }
        } catch (err) {
            console.error('获取组别失败:', err);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        // 增加必填校验
        const requiredFields = {
            name: '姓名',
            gender: '性别',
            birthday: '生日',
            height: '身高',
            weight: '体重',
            group: '组别'
        };

        for (const [key, label] of Object.entries(requiredFields)) {
            if (!formData[key]) {
                setError(`${label}是必填项`);
                return;
            }
        }

        try {
            setLoading(true);
            setError('');
            await userApi.create(formData);
            
            // 显示成功提示
            setIsSuccess(true);
            
            // 2秒后关闭弹窗并执行成功回调
            setTimeout(() => {
                onSuccess();
                onClose();
                // 重置状态
                setIsSuccess(false);
                setFormData({
                    name: '', gender: 1, birthday: '', height: '', weight: '',
                    group: groups[0]?.id || '', phone: '', id_number: '', remark: ''
                });
            }, 2000);
            
        } catch (err) {
            setError(err.response?.data?.message || '创建失败，请稍后重试');
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.7)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'flex-start', // 改为靠顶，解决小屏显示不全
            justifyContent: 'center',
            zIndex: 2000,
            overflowY: 'auto', // 开启遮罩层滚动
            padding: '40px 20px', // 上下留白，确保不贴边
            animation: 'fadeIn 0.3s ease-out'
        }}>
            <div className="card" style={{
                width: '100%',
                maxWidth: '600px',
                margin: 'auto 0', // 垂直居中技巧：配合 flex-start 使其在内容不足时居中，内容超长时靠顶
                padding: '32px',
                position: 'relative',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.1)'
            }}>
                <button
                    onClick={onClose}
                    style={{
                        position: 'absolute',
                        top: '20px',
                        right: '20px',
                        background: 'none',
                        border: 'none',
                        color: 'var(--text-muted)',
                        cursor: 'pointer'
                    }}
                >
                    <X size={24} />
                </button>

                <h3 style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <User className="text-primary" />
                    录入新运动员
                </h3>

                {error && (
                    <div style={{
                        backgroundColor: 'rgba(255, 59, 48, 0.1)',
                        border: '1px solid rgba(255, 59, 48, 0.3)',
                        color: '#FF3B30',
                        padding: '12px 16px',
                        borderRadius: '12px',
                        marginBottom: '20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        fontSize: '14px'
                    }}>
                        <AlertCircle size={18} />
                        {error}
                    </div>
                )}

                {isSuccess ? (
                    <div style={{
                        textAlign: 'center',
                        padding: '40px 0',
                        animation: 'scaleIn 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
                    }}>
                        <div style={{
                            width: '80px',
                            height: '80px',
                            backgroundColor: 'rgba(52, 199, 89, 0.1)',
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 24px',
                            border: '2px solid rgba(52, 199, 89, 0.3)',
                            color: '#34C759'
                        }}>
                            <CheckCircle2 size={48} />
                        </div>
                        <h2 style={{ color: '#34C759', marginBottom: '8px' }}>录入成功</h2>
                        <p style={{ color: 'var(--text-muted)' }}>运动员信息已成功保存至系统</p>
                        
                        <style>{`
                            @keyframes scaleIn {
                                from { opacity: 0; transform: scale(0.8); }
                                to { opacity: 1; transform: scale(1); }
                            }
                        `}</style>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                        {/* 姓名 */}
                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>姓名 <span style={{ color: '#FF3B30' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <User size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    placeholder="请输入姓名"
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>

                        {/* 性别 */}
                        <div className="form-group">
                            <label>性别 <span style={{ color: '#FF3B30' }}>*</span></label>
                            <select name="gender" value={formData.gender} onChange={handleChange}>
                                <option value={1}>男</option>
                                <option value={2}>女</option>
                            </select>
                        </div>

                        {/* 组别 */}
                        <div className="form-group">
                            <label>分配组别 <span style={{ color: '#FF3B30' }}>*</span></label>
                            <select name="group" value={formData.group} onChange={handleChange}>
                                <option value="">请选择组别</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>{g.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* 生日/身高/体重 */}
                        <div className="form-group">
                            <label>出生日期 <span style={{ color: '#FF3B30' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <Calendar size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                                <input
                                    type="date"
                                    name="birthday"
                                    value={formData.birthday}
                                    onChange={handleChange}
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>身高 (cm) <span style={{ color: '#FF3B30' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <Ruler size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                                <input
                                    type="number"
                                    name="height"
                                    value={formData.height}
                                    onChange={handleChange}
                                    placeholder="cm"
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>体重 (kg) <span style={{ color: '#FF3B30' }}>*</span></label>
                            <div style={{ position: 'relative' }}>
                                <Weight size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                                <input
                                    type="number"
                                    name="weight"
                                    value={formData.weight}
                                    onChange={handleChange}
                                    placeholder="kg"
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>联系电话</label>
                            <div style={{ position: 'relative' }}>
                                <Phone size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-disabled)' }} />
                                <input
                                    type="text"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    placeholder="请输入手机号"
                                    style={{ paddingLeft: '48px' }}
                                />
                            </div>
                        </div>

                        <div className="form-group" style={{ gridColumn: 'span 2' }}>
                            <label>备注信息</label>
                            <div style={{ position: 'relative' }}>
                                <Tag size={18} style={{ position: 'absolute', left: '16px', top: '16px', color: 'var(--text-disabled)' }} />
                                <textarea
                                    name="remark"
                                    value={formData.remark}
                                    onChange={handleChange}
                                    placeholder="补充其他说明信息..."
                                    style={{ paddingLeft: '48px', minHeight: '80px' }}
                                />
                            </div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '16px', marginTop: '32px' }}>
                        <button
                            type="button"
                            className="btn btn-secondary"
                            style={{ flex: 1, justifyContent: 'center' }}
                            onClick={onClose}
                            disabled={loading}
                        >
                            取消
                        </button>
                        <button
                            type="submit"
                            className="btn btn-primary"
                            style={{ flex: 1, justifyContent: 'center' }}
                            disabled={loading}
                        >
                            {loading ? '提交中...' : '确认录入'}
                        </button>
                    </div>
                </form>
                )}
            </div>
        </div>,
        document.body
    );
};

export default CreateUserModal;
