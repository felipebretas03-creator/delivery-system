import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function AdminDashboard() {
  const [orders, setOrders] = useState([]);
  const [motoboys, setMotoboys] = useState([]);
  const [metrics, setMetrics] = useState({ avgTimeMinutes: 0, totalDelivered: 0 });
  const navigate = useNavigate();

  // Order Form State
  const [customerName, setCustomerName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');

  // Motoboy Form State
  const [mbName, setMbName] = useState('');
  const [mbEmail, setMbEmail] = useState('');
  const [mbPassword, setMbPassword] = useState('');
  const [mbMessage, setMbMessage] = useState('');

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'https://delivery-system-production-6da2.up.railway.app/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const [ordRes, motRes, metRes] = await Promise.all([
        api.get('/orders'),
        api.get('/motoboys/active'),
        api.get('/metrics')
      ]);
      setOrders(ordRes.data);
      setMotoboys(motRes.data);
      setMetrics(metRes.data);
    } catch (e) {
      if (e.response?.status === 401) {
        localStorage.clear();
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleCreateOrder = async (e) => {
    e.preventDefault();
    await api.post('/orders', { customerName, address, phone });
    setCustomerName(''); setAddress(''); setPhone('');
    fetchData();
  };

  const handleAssignOrder = async (orderId, motoboyId) => {
    if (!motoboyId) return;
    await api.post('/orders/assign', { orderId, motoboyId });
    fetchData();
  };

  const handleCreateMotoboy = async (e) => {
    e.preventDefault();
    try {
      await axios.post('https://delivery-system-production-6da2.up.railway.app/api/auth/register', { name: mbName, email: mbEmail, password: mbPassword });
      setMbMessage('Motoboy criado com sucesso!');
      setMbName(''); setMbEmail(''); setMbPassword('');
      setTimeout(() => setMbMessage(''), 3000);
      fetchData();
    } catch (err) {
      setMbMessage('Erro ao criar: e-mail já existe ou inválido');
      setTimeout(() => setMbMessage(''), 3000);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  return (
    <div className="container">
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
        <h2>Painel Admin</h2>
        <button className="btn btn-outline" style={{width: 'auto', padding: '8px 16px'}} onClick={handleLogout}>Sair</button>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card">
          <h3>Métricas (Hoje)</h3>
          <p style={{ fontSize: '2rem', color: 'var(--accent-color)', fontWeight: 'bold' }}>{metrics.avgTimeMinutes} min</p>
          <p>Tempo Médio de Entrega</p>
          <hr style={{ borderColor: '#374151', margin: '16px 0' }} />
          <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{metrics.totalDelivered}</p>
          <p>Entregas Concluídas</p>
        </div>

        <div className="card">
          <h3>Motoboys Ativos ({motoboys.length})</h3>
          <ul style={{ listStyle: 'none', padding: 0, marginTop: '16px' }}>
            {motoboys.map(m => (
              <li key={m.id} style={{ padding: '8px 0', borderBottom: '1px solid #374151', display: 'flex', justifyContent: 'space-between' }}>
                <span>{m.name}</span>
                <span className="badge delivered" style={{fontSize: '0.7rem'}}>ONLINE</span>
              </li>
            ))}
            {motoboys.length === 0 && <p style={{color: 'var(--text-secondary)'}}>Nenhum motoboy logado hoje.</p>}
          </ul>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '20px', marginBottom: '32px' }}>
        <div className="card">
          <h3>Nova Entrega</h3>
          <form style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }} onSubmit={handleCreateOrder}>
            <div style={{flex: '1 1 200px'}}>
              <input className="input-group" style={{width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #374151', background: '#111827', color: '#fff'}} required placeholder="Nome do Cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
            <div style={{flex: '2 1 300px'}}>
              <input className="input-group" style={{width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #374151', background: '#111827', color: '#fff'}} required placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
            <div style={{flex: '1 1 150px'}}>
              <input className="input-group" style={{width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #374151', background: '#111827', color: '#fff'}} required placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{width: '100%', padding: '14px 24px'}}>Criar Pedido</button>
          </form>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3>Novo Motoboy</h3>
             {mbMessage && <span style={{fontSize: '0.9rem', fontWeight: 'bold', color: mbMessage.includes('Erro') ? 'var(--status-red)' : 'var(--status-green)'}}>{mbMessage}</span>}
          </div>
          <form style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginTop: '16px' }} onSubmit={handleCreateMotoboy}>
            <div style={{flex: '1 1 200px'}}>
              <input className="input-group" style={{width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #374151', background: '#111827', color: '#fff'}} required placeholder="Nome do Motoboy" value={mbName} onChange={e => setMbName(e.target.value)} />
            </div>
            <div style={{flex: '2 1 200px'}}>
              <input className="input-group" type="email" style={{width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #374151', background: '#111827', color: '#fff'}} required placeholder="E-mail de Login" value={mbEmail} onChange={e => setMbEmail(e.target.value)} />
            </div>
            <div style={{flex: '1 1 150px'}}>
              <input className="input-group" type="password" style={{width: '100%', padding: '14px', borderRadius: '12px', border: '1px solid #374151', background: '#111827', color: '#fff'}} required placeholder="Senha" value={mbPassword} onChange={e => setMbPassword(e.target.value)} />
            </div>
            <button className="btn btn-primary" style={{width: '100%', padding: '14px 24px'}}>Cadastrar Motoboy</button>
          </form>
        </div>
      </div>

      <h3>Acompanhamento de Entregas</h3>
      <div style={{ marginTop: '16px' }}>
        {orders.map(order => {
          let badgeClass = "badge pending";
          if (order.status === 'ACCEPTED') badgeClass = "badge accepted";
          if (order.status === 'IN_TRANSIT') badgeClass = "badge in_transit";
          if (order.status === 'DELIVERED') badgeClass = "badge delivered";
          
          let minsPassed = null;
          if (order.status === 'IN_TRANSIT' && order.startedAt) {
             minsPassed = Math.floor((new Date() - new Date(order.startedAt)) / 60000);
             if (minsPassed > 20) badgeClass = "badge delayed timer-delayed";
          }

          return (
            <div className="card" key={order.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ flex: '1 1 300px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                  <strong>#00{order.id}</strong> - {order.customerName}
                  <span className={badgeClass}>
                    {order.status} {minsPassed !== null ? `(${minsPassed}m)` : ''}
                  </span>
                </div>
                <p>{order.address} | {order.phone}</p>
              </div>
              
              <div style={{ flex: '0 0 auto', minWidth: '200px' }}>
                {order.motoboy ? (
                  <div style={{ padding: '8px 16px', background: '#374151', borderRadius: '8px', textAlign: 'center' }}>
                    Motoboy: <strong>{order.motoboy.name}</strong>
                  </div>
                ) : (
                  <select 
                    style={{width: '100%', padding: '12px', borderRadius: '8px', background: '#111827', color: '#fff', border: '1px solid #374151'}} 
                    onChange={(e) => handleAssignOrder(order.id, e.target.value)}
                    defaultValue=""
                  >
                    <option value="" disabled>Atribuir a um motoboy...</option>
                    {motoboys.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                )}
              </div>
            </div>
          )
        })}
        {orders.length === 0 && <p style={{color: 'var(--text-secondary)'}}>Nenhum pedido no sistema.</p>}
      </div>
    </div>
  );
}

export default AdminDashboard;
