import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import TrainList from './pages/TrainList';
import Ranking from './pages/Ranking';
import UserList from './pages/UserList';
import UserSummary from './pages/UserSummary';
import Login from './pages/Login';
import TrainDetail from './pages/TrainDetail';
import TrainComparison from './pages/TrainComparison';
import './App.css';

const ProtectedRoute = ({ children }) => {
  const token = localStorage.getItem('token');
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const Layout = ({ children }) => (
  <div className="app">
    <Navbar />
    <main>
      {children}
    </main>
  </div>
);

function App() {
  return (
    <Router>
      <Routes>
        {/* 基础路由 */}
        <Route path="/login" element={<Login />} />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        
        {/* 核心业务路由 - 受到保护 */}
        <Route path="/dashboard" element={<ProtectedRoute><Layout><Dashboard /></Layout></ProtectedRoute>} />
        <Route path="/train-list" element={<ProtectedRoute><Layout><TrainList /></Layout></ProtectedRoute>} />
        <Route path="/ranking" element={<ProtectedRoute><Layout><Ranking /></Layout></ProtectedRoute>} />
        <Route path="/user-list" element={<ProtectedRoute><Layout><UserList /></Layout></ProtectedRoute>} />
        <Route path="/user-summary/:id" element={<ProtectedRoute><Layout><UserSummary /></Layout></ProtectedRoute>} />
        <Route path="/train-detail/:id" element={<ProtectedRoute><Layout><TrainDetail /></Layout></ProtectedRoute>} />
        <Route path="/comparison" element={<ProtectedRoute><Layout><TrainComparison /></Layout></ProtectedRoute>} />
        
        {/* 404 处理 */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
