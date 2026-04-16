import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MotoboyDashboard from './pages/MotoboyDashboard';
import './styles/global.css';

const PrivateRoute = ({ children, allowedRole }) => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  
  if (!token || role !== allowedRole) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

const RootRedirect = () => {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  return <Navigate to={token ? (role === 'ADMIN' ? '/admin' : '/motoboy') : '/login'} replace />;
};

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<RootRedirect />} />
        <Route path="/login" element={<Login />} />
        <Route 
          path="/admin" 
          element={<PrivateRoute allowedRole="ADMIN"><AdminDashboard /></PrivateRoute>} 
        />
        <Route 
          path="/motoboy" 
          element={<PrivateRoute allowedRole="MOTOBOY"><MotoboyDashboard /></PrivateRoute>} 
        />
      </Routes>
    </Router>
  );
}

export default App;
