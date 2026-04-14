import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function MotoboyDashboard() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('ONLINE');
  const [name, setName] = useState(localStorage.getItem('name'));
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'https://delivery-system-production-6da2.up.railway.app/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const { data } = await api.get('/motoboy/orders');
      setOrders(data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => {
      fetchData();
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleStatusChange = async (targetOrder, newStatus) => {
    await api.put(`/orders/${targetOrder.id}/status`, { status: newStatus });
    fetchData();
  };

  const handleLogout = () => {
    api.put('/motoboy/status', { status: 'OFFLINE' });
    localStorage.clear();
    navigate('/login');
  };

  const calculateMinutesPassed = (startedAt) => {
    if (!startedAt) return 0;
    const diff = new Date() - new Date(startedAt);
    return Math.floor(diff / 60000);
  };

  const pendingOrTransit = orders.filter(o => o.status !== 'DELIVERED');
  const delivered = orders.filter(o => o.status === 'DELIVERED');

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2>Olá, {name}</h2>
          <span className="badge accepted">Estou {status}</span>
        </div>
        <button className="btn btn-outline" style={{width: 'auto', padding: '8px 16px'}} onClick={handleLogout}>Sair (Check-out)</button>
      </header>

      <h3>Entregas Atuais ({pendingOrTransit.length})</h3>
      {pendingOrTransit.length === 0 && <p style={{color: 'var(--text-secondary)'}}>Nenhuma entrega pendente no momento.</p>}
      
      {pendingOrTransit.map(order => {
        const minsPassed = calculateMinutesPassed(order.startedAt);
        const isDelayed = order.status === 'IN_TRANSIT' && minsPassed > 20;

        return (
          <div className="card" key={order.id}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
              <div>
                <h3 style={{ fontSize: '1.2rem'}}>{order.customerName}</h3>
                <p>{order.address}</p>
                <p>Tel: {order.phone}</p>
              </div>
              {order.status === 'IN_TRANSIT' && (
                <div className={`badge ${isDelayed ? 'timer-delayed' : 'in_transit'}`} style={{ padding: '8px 12px', fontSize: '1rem' }}>
                  {minsPassed} MIN EM ROTA
                </div>
              )}
            </div>
            
            <div style={{ marginTop: '16px' }}>
              {order.status === 'PENDING' && (
                <button className="btn btn-yellow" onClick={() => handleStatusChange(order, 'ACCEPTED')}>
                  Aceitar Entrega
                </button>
              )}
              {order.status === 'ACCEPTED' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange(order, 'IN_TRANSIT')}>
                  Iniciar Entrega
                </button>
              )}
              {order.status === 'IN_TRANSIT' && (
                <button className="btn btn-green" onClick={() => handleStatusChange(order, 'DELIVERED')}>
                  Finalizar Entrega (Entregue)
                </button>
              )}
            </div>
          </div>
        )
      })}

      <h3 style={{ marginTop: '32px' }}>Histórico (Hoje)</h3>
      {delivered.slice(0, 5).map(o => (
        <div className="card" key={o.id} style={{ opacity: 0.7 }}>
          <h4>{o.customerName}</h4>
          <p>Entregue com sucesso</p>
        </div>
      ))}
    </div>
  );
}

export default MotoboyDashboard;
