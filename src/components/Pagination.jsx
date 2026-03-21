import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';

const Pagination = ({ total, page, pageSize, onPageChange }) => {
  const totalPages = Math.ceil(total / pageSize);
  const [jumpPage, setJumpPage] = useState('');

  const handleJump = (e) => {
    e.preventDefault();
    const num = parseInt(jumpPage);
    if (num >= 1 && num <= totalPages) {
      onPageChange(num);
      setJumpPage('');
    }
  };

  return (
    <div className="pagination-v2">
      <div className="pagination-summary">
        共 <span className="blue">{total}</span> 条记录
      </div>
      
      <div className="pagination-nav">
        <button 
          className="nav-btn" 
          disabled={page === 1}
          onClick={() => onPageChange(1)}
          title="第一页"
        >
          <ChevronsLeft size={16} />
        </button>
        
        <button 
          className="nav-btn prev" 
          disabled={page === 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft size={16} />
          <span>上一页</span>
        </button>

        <div className="page-indicator">
          第 <span className="current">{page}</span> / {totalPages} 页
        </div>

        <button 
          className="nav-btn next" 
          disabled={page === totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          <span>下一页</span>
          <ChevronRight size={16} />
        </button>

        <button 
          className="nav-btn" 
          disabled={page === totalPages}
          onClick={() => onPageChange(totalPages)}
          title="最后一页"
        >
          <ChevronsRight size={16} />
        </button>
      </div>

      <form className="pagination-jump" onSubmit={handleJump}>
        <span>前往</span>
        <input 
          type="number" 
          value={jumpPage}
          onChange={(e) => setJumpPage(e.target.value)}
          placeholder={page}
          min="1"
          max={totalPages}
        />
        <span>页</span>
        <button type="submit" className="jump-btn">确认</button>
      </form>

      <style>{`
        .pagination-v2 {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin: 40px 0;
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.03);
          backdrop-filter: blur(10px);
          border-radius: 14px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          font-size: 14px;
          color: var(--text-secondary);
        }
        .pagination-summary .blue {
          color: var(--primary-color);
          font-weight: 600;
          margin: 0 4px;
        }
        .pagination-nav {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .nav-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 8px 16px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          color: var(--text-primary);
          cursor: pointer;
          transition: all 0.2s;
        }
        .nav-btn:hover:not(:disabled) {
          border-color: var(--primary-color);
          background: rgba(0, 122, 255, 0.1);
          color: var(--primary-color);
        }
        .nav-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        .page-indicator {
          padding: 0 16px;
          font-weight: 500;
          color: var(--text-muted);
        }
        .page-indicator .current {
          color: var(--text-primary);
          font-weight: 700;
          font-size: 16px;
        }
        .pagination-jump {
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .pagination-jump input {
          width: 80px;
          height: 36px;
          padding: 0 8px;
          background: var(--bg-tertiary);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          text-align: center;
          color: var(--text-primary);
          font-weight: 600;
          outline: none;
          transition: all 0.2s;
        }
        .pagination-jump input:focus {
          border-color: var(--primary-color);
          background: rgba(255, 255, 255, 0.05);
        }
        .jump-btn {
          padding: 4px 12px;
          background: transparent;
          border: 1px solid var(--primary-color);
          color: var(--primary-color);
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.2s;
        }
        .jump-btn:hover {
          background: var(--primary-color);
          color: white;
        }
        input::-webkit-outer-spin-button,
        input::-webkit-inner-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      `}</style>
    </div>
  );
};

export default Pagination;
