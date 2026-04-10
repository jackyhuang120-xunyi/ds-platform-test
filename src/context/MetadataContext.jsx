import React, { createContext, useContext, useState, useEffect } from 'react';
import { trainApi } from '../services/api';

const MetadataContext = createContext();

export const MetadataProvider = ({ children }) => {
  const [metadata, setMetadata] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        const data = await trainApi.getMetadata();
        setMetadata(data);
      } catch (error) {
        console.error('Failed to fetch metadata:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchMetadata();
  }, []);

  /**
   * 核心字典翻译函数
   * @param {string} dictKey - 字典键名 (genders, types, parts, groups)
   * @param {number|string} value - 原始 ID
   * @returns {string} - 翻译后的 Label，加载中或未找到时返回空
   */
  const getLabel = (dictKey, value) => {
    if (loading || !metadata || !metadata[dictKey]) return '';
    
    // 兼容数字和字符串 ID 匹配
    const item = metadata[dictKey].find(i => String(i.id) === String(value));
    return item ? item.name : '';
  };

  /**
   * 获取全量字典项（用于下拉列表）
   */
  const getOptions = (dictKey) => {
    return metadata?.[dictKey] || [];
  };

  return (
    <MetadataContext.Provider value={{ metadata, loading, getLabel, getOptions }}>
      {children}
    </MetadataContext.Provider>
  );
};

export const useMetaData = () => {
  const context = useContext(MetadataContext);
  if (!context) {
    throw new Error('useMetaData must be used within a MetadataProvider');
  }
  return context;
};

export default MetadataContext;
