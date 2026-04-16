import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import Layout from '../components/Layout';

function AdminDashboard() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [orders, setOrders] = useState([]);
  const [motoboys, setMotoboys] = useState([]);
  const [metrics, setMetrics] = useState({ avgTimeMinutes: 0, totalDelivered: 0 });
  const [filterMotoboyId, setFilterMotoboyId] = useState('');
  const navigate = useNavigate();

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

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
    setIsCreating(true);
    setMbMessage('');
    try {
      await api.post('/auth/register', { name: mbName, email: mbEmail, password: mbPassword });
      setMbMessage('Motoboy criado com sucesso!');
      setMbName(''); setMbEmail(''); setMbPassword('');
      fetchData();
      setTimeout(() => {
        setMbMessage('');
        setIsModalOpen(false);
      }, 1500);
    } catch (err) {
      setMbMessage(err.response?.data?.error || 'Erro ao cadastrar. Verifique os dados.');
    } finally {
      setIsCreating(false);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    navigate('/login');
  };

  const renderDashboard = () => {
    const deliveredOrders = orders.filter(o => o.status === 'DELIVERED' && o.startedAt && o.deliveredAt);
    const filteredOrders = filterMotoboyId 
      ? deliveredOrders.filter(o => o.motoboyId === parseInt(filterMotoboyId))
      : deliveredOrders;

    return (
      <>
        <h1 className="text-center" style={{marginBottom: '40px'}}>Visão Geral (Hoje)</h1>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto' }}>
          
          <div className="card text-center" style={{marginTop: '16px'}}>
            <div className="card-badge-top">Entregas</div>
            <p style={{ fontSize: '2.5rem', color: 'var(--text-dark)', fontWeight: 'bold', margin: '16px 0 8px' }}>
              {metrics.totalDelivered}
            </p>
            <p>Concluídas hoje</p>
          </div>

          <div className="card text-center" style={{marginTop: '16px'}}>
            <div className="card-badge-top">Desempenho</div>
            <p style={{ fontSize: '2.5rem', color: 'var(--text-dark)', fontWeight: 'bold', margin: '16px 0 8px' }}>
              {metrics.avgTimeMinutes}m
            </p>
            <p>Tempo Médio</p>
          </div>

          <div className="card text-center" style={{marginTop: '16px'}}>
            <div className="card-badge-top">Frota</div>
            <p style={{ fontSize: '2.5rem', color: 'var(--text-dark)', fontWeight: 'bold', margin: '16px 0 8px' }}>
              {motoboys.length}
            </p>
            <p>Motoboys Online</p>
          </div>
        </div>

        <div className="card" style={{ maxWidth: '900px', margin: '40px auto 0' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderBottom: '1px solid var(--border-color)', paddingBottom: '16px' }}>
            <h3 style={{ margin: 0 }}>Tempo de Entrega por Pedido</h3>
            <div className="input-group" style={{ marginBottom: 0, width: 'auto', minWidth: '200px' }}>
              <select 
                value={filterMotoboyId} 
                onChange={(e) => setFilterMotoboyId(e.target.value)}
                style={{ padding: '8px' }}
              >
                <option value="">Todos os Motoboys</option>
                {motoboys.map(m => (
                  <option key={m.id} value={m.id}>{m.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)' }}>
                  <th style={{ padding: '12px 8px' }}>Pedido</th>
                  <th style={{ padding: '12px 8px' }}>Cliente</th>
                  <th style={{ padding: '12px 8px' }}>Motoboy</th>
                  <th style={{ padding: '12px 8px' }}>Tempo Gasto</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => {
                  const startTime = new Date(order.startedAt);
                  const deliverTime = new Date(order.deliveredAt);
                  const diffMinutes = Math.floor((deliverTime - startTime) / 60000);
                  
                  return (
                    <tr key={order.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px 8px', color: 'var(--text-light)' }}>#{order.id.toString().padStart(4, '0')}</td>
                      <td style={{ padding: '12px 8px', fontWeight: 500 }}>{order.customerName}</td>
                      <td style={{ padding: '12px 8px' }}>{order.motoboy?.name || 'Desconhecido'}</td>
                      <td style={{ padding: '12px 8px' }}>
                        <span className={`badge ${diffMinutes > 20 ? 'delayed' : 'delivered'}`}>
                          {diffMinutes} min
                        </span>
                      </td>
                    </tr>
                  );
                })}
                {filteredOrders.length === 0 && (
                  <tr>
                    <td colSpan="4" style={{ padding: '24px', textAlign: 'center', color: 'var(--text-light)' }}>
                      Nenhuma entrega concluída encontrada.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </>
    );
  };

  const renderEntregas = () => (
    <>
      <h1 className="text-center" style={{marginBottom: '40px'}}>Gestão de Entregas</h1>
      
      <div className="card" style={{ maxWidth: '900px', margin: '0 auto 32px' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>
          Nova Entrega
        </h3>
        <form style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }} onSubmit={handleCreateOrder}>
          <div style={{flex: '1 1 200px'}}>
            <div className="input-group" style={{marginBottom: 0}}>
              <input required placeholder="Nome do Cliente" value={customerName} onChange={e => setCustomerName(e.target.value)} />
            </div>
          </div>
          <div style={{flex: '2 1 300px'}}>
            <div className="input-group" style={{marginBottom: 0}}>
              <input required placeholder="Endereço" value={address} onChange={e => setAddress(e.target.value)} />
            </div>
          </div>
          <div style={{flex: '1 1 150px'}}>
            <div className="input-group" style={{marginBottom: 0}}>
              <input required placeholder="Telefone" value={phone} onChange={e => setPhone(e.target.value)} />
            </div>
          </div>
          <button className="btn btn-primary" style={{width: 'auto', padding: '0 24px'}}>Criar</button>
        </form>
      </div>

      <div style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ marginBottom: '16px', color: 'var(--text-dark)' }}>Acompanhamento</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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
              <div className="card" key={order.id} style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', alignItems: 'center', justifyContent: 'space-between', marginBottom: 0 }}>
                <div style={{ flex: '1 1 300px' }}>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '8px' }}>
                    <strong>#{order.id.toString().padStart(4, '0')}</strong> - <span style={{fontWeight: 500}}>{order.customerName}</span>
                    <span className={badgeClass}>
                      {order.status} {minsPassed !== null ? `(${minsPassed}m)` : ''}
                    </span>
                  </div>
                  <p style={{ margin: 0 }}>{order.address} | {order.phone}</p>
                </div>
                
                <div style={{ flex: '0 0 auto', minWidth: '220px' }}>
                  {order.motoboy ? (
                    <div style={{ padding: '8px 16px', background: 'var(--main-bg)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--border-color)' }}>
                      Motoboy: <strong style={{color: 'var(--text-dark)'}}>{order.motoboy.name}</strong>
                    </div>
                  ) : (
                    <div className="input-group" style={{ marginBottom: 0 }}>
                      <select 
                        onChange={(e) => handleAssignOrder(order.id, e.target.value)}
                        defaultValue=""
                      >
                        <option value="" disabled>Atribuir a motoboy...</option>
                        {motoboys.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                      </select>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {orders.length === 0 && <p className="text-light text-center" style={{marginTop: '24px'}}>Nenhum pedido no sistema.</p>}
        </div>
      </div>
    </>
  );

  const renderMotoboys = () => (
    <>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', maxWidth: '900px', margin: '0 auto 40px' }}>
        <h1 style={{ margin: 0 }}>Equipe de Motoboys</h1>
        <button className="btn btn-primary" style={{width: 'auto'}} onClick={() => setIsModalOpen(true)}>
          + Cadastrar Motoboy
        </button>
      </div>

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Motoboys Ativos ({motoboys.length})</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {motoboys.map(m => (
            <li key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{m.name}</span>
              <span className="badge delivered" style={{fontSize: '0.7rem'}}>ONLINE</span>
            </li>
          ))}
          {motoboys.length === 0 && <p className="text-light" style={{padding: '16px 0'}}>Nenhum motoboy logado hoje.</p>}
        </ul>
      </div>
    </>
  );

  const renderFinanceiro = () => (
    <>
      <h1 className="text-center" style={{marginBottom: '40px'}}>Financeiro</h1>
      <div className="card text-center" style={{ maxWidth: '600px', margin: '0 auto', padding: '48px 24px' }}>
        <span style={{ fontSize: '3rem', display: 'block', marginBottom: '16px' }}>🚧</span>
        <h3>Módulo em Desenvolvimento</h3>
        <p>A área financeira estará disponível nas próximas atualizações do sistema.</p>
      </div>
    </>
  );

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab}>
      
      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'entregas' && renderEntregas()}
      {activeTab === 'motoboys' && renderMotoboys()}
      {activeTab === 'financeiro' && renderFinanceiro()}

      {/* Modal para Cadastro */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="modal-close" onClick={() => setIsModalOpen(false)}>&times;</button>
            <h3 style={{ marginBottom: '16px' }}>Cadastrar Motoboy</h3>
            
            {mbMessage && (
              <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '8px', 
                backgroundColor: mbMessage.includes('Erro') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                color: mbMessage.includes('Erro') ? 'var(--status-red)' : 'var(--status-green)' 
              }}>
                {mbMessage}
              </div>
            )}

            <form onSubmit={handleCreateMotoboy}>
              <div className="input-group">
                <label>Nome Completo</label>
                <input required type="text" placeholder="Ex: João da Silva" value={mbName} onChange={e => setMbName(e.target.value)} disabled={isCreating} />
              </div>
              <div className="input-group">
                <label>E-mail de Login</label>
                <input required type="email" placeholder="motoboy@exemplo.com" value={mbEmail} onChange={e => setMbEmail(e.target.value)} disabled={isCreating} />
              </div>
              <div className="input-group">
                <label>Senha</label>
                <input required type="password" placeholder="Mínimo 6 caracteres" value={mbPassword} onChange={e => setMbPassword(e.target.value)} disabled={isCreating} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '24px'}} disabled={isCreating}>
                {isCreating ? 'Cadastrando...' : 'Finalizar Cadastro'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Botão de sair global escondido, pode ir no perfil mas colocarei fixo provisoriamente */}
      <div style={{ position: 'fixed', bottom: '32px', right: '32px' }}>
        <button className="btn btn-outline" style={{ background: 'white', boxShadow: 'var(--shadow-sm)' }} onClick={handleLogout}>Sair do Sistema</button>
      </div>

    </Layout>
  );
}

export default AdminDashboard;
