import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MotoboyDashboard from './pages/MotoboyDashboard';
import './styles/global.css';

function App() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  return (
    <Router>
      <Routes>
        <Route path="/" element={<Navigate to={token ? (role === 'ADMIN' ? '/admin' : '/motoboy') : '/login'} replace />} />
        <Route path="/login" element={<Login />} />
        <Route path="/admin" element={token && role === 'ADMIN' ? <AdminDashboard /> : <Navigate to="/login" replace />} />
        <Route path="/motoboy" element={token && role === 'MOTOBOY' ? <MotoboyDashboard /> : <Navigate to="/login" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
