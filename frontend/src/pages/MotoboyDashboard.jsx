import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function MotoboyDashboard() {
  const [orders, setOrders] = useState([]);
  const [status, setStatus] = useState('ONLINE');
  const [name, setName] = useState(localStorage.getItem('name'));
  const [finance, setFinance] = useState({ pendingBalance: 0, totalReceived: 0, recentHistory: [] });
  const [currentTime, setCurrentTime] = useState(new Date());
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'https://delivery-system-production-6da2.up.railway.app/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const [ordRes, finRes] = await Promise.all([
        api.get(`/motoboy/orders?_t=${new Date().getTime()}`),
        api.get(`/motoboy/finance?_t=${new Date().getTime()}`)
      ]);
      setOrders(ordRes.data);
      setFinance(finRes.data);
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
      if (!loading) {
        fetchData();
      }
      setCurrentTime(new Date());
    }, 5000);
    return () => clearInterval(interval);
  }, [loading]);

  const handleStatusChange = async (targetOrder, newStatus) => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await api.put(`/orders/${targetOrder.id}/status`, { status: newStatus });
      console.log('Status atualizado com sucesso:', res.data);
      await fetchData();
    } catch (e) {
       console.error('Erro na requisição:', e.response || e);
       alert(`Erro ao atualizar status! Código: ${e.response?.status || e.message}. Mensagem: ${e.response?.data?.error || 'Verifique a conexão.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      await api.put('/motoboy/status', { status: 'OFFLINE' });
    } catch(e) {}
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
        <button className="btn btn-outline" style={{width: 'auto', padding: '8px 16px'}} onClick={handleLogout} disabled={loading}>
          {loading ? 'Aguarde...' : 'Sair (Check-out)'}
        </button>
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
                <button className="btn btn-yellow" onClick={() => handleStatusChange(order, 'ACCEPTED')} disabled={loading}>
                  {loading ? 'Aguarde...' : 'Aceitar Entrega'}
                </button>
              )}
              {order.status === 'ACCEPTED' && (
                <button className="btn btn-primary" onClick={() => handleStatusChange(order, 'IN_TRANSIT')} disabled={loading}>
                  {loading ? 'Aguarde...' : 'Iniciar Entrega'}
                </button>
              )}
              {order.status === 'IN_TRANSIT' && (
                <button className="btn btn-green" onClick={() => handleStatusChange(order, 'DELIVERED')} disabled={loading}>
                  {loading ? 'Aguarde...' : 'Finalizar Entrega (Entregue)'}
                </button>
              )}
            </div>
          </div>
        )
      })}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginTop: '32px' }}>
        <div className="card text-center" style={{ margin: 0, padding: '16px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>Saldo a Receber</p>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-red)' }}>R$ {(finance?.pendingBalance || 0).toFixed(2).replace('.', ',')}</p>
        </div>
        <div className="card text-center" style={{ margin: 0, padding: '16px' }}>
          <p style={{ margin: '0 0 8px 0', fontSize: '0.9rem', color: 'var(--text-light)' }}>Total Recebido</p>
          <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--status-green)' }}>R$ {(finance?.totalReceived || 0).toFixed(2).replace('.', ',')}</p>
        </div>
      </div>

      <h3 style={{ marginTop: '32px' }}>Histórico (Hoje)</h3>
      {delivered.slice(0, 5).map(o => {
        const startTime = new Date(o.startedAt);
        const deliverTime = new Date(o.deliveredAt);
        const diffMinutes = Math.floor((deliverTime - startTime) / 60000);

        return (
          <div className="card" key={o.id} style={{ opacity: o.motoboyPaid ? 0.6 : 0.9, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0' }}>{o.customerName}</h4>
              <p style={{ margin: 0, fontSize: '0.9rem', color: 'var(--text-light)' }}>
                {o.motoboyPaid ? '✓ Pago' : '⏳ Pendente'} | Taxa: R$ {(o.deliveryFee || 0).toFixed(2).replace('.', ',')}
              </p>
            </div>
            {o.startedAt && o.deliveredAt && (
              <span className={`badge ${diffMinutes > 20 ? 'delayed' : 'delivered'}`} style={{ fontSize: '0.9rem' }}>
                Tempo: {diffMinutes} min
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}

export default MotoboyDashboard;
