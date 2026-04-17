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
  const [orderValue, setOrderValue] = useState('');
  const [deliveryFee, setDeliveryFee] = useState('');
  const [financeData, setFinanceData] = useState({ totalSystemValue: 0, totalPendingToMotoboys: 0, motoboys: [] });

  // Motoboy Form State
  const [mbName, setMbName] = useState('');
  const [mbUsername, setMbUsername] = useState('');
  const [mbPassword, setMbPassword] = useState('');
  const [mbSalary, setMbSalary] = useState('');
  const [mbMessage, setMbMessage] = useState('');
  const [editMotoboyId, setEditMotoboyId] = useState(null);
  
  // Settings State
  const [fixedFee, setFixedFee] = useState('');

  const token = localStorage.getItem('token');
  const api = axios.create({
    baseURL: 'https://delivery-system-production-6da2.up.railway.app/api',
    headers: { Authorization: `Bearer ${token}` }
  });

  const fetchData = async () => {
    try {
      const [ordRes, motRes, metRes, finRes, cfgRes] = await Promise.all([
        api.get('/orders'),
        api.get('/motoboys/active'),
        api.get('/metrics'),
        api.get('/finance'),
        api.get('/config/FIXED_FEE')
      ]);
      setOrders(ordRes.data);
      setMotoboys(motRes.data);
      setMetrics(metRes.data);
      setFinanceData(finRes.data);
      setFixedFee(cfgRes.data.value || '');
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
    await api.post('/orders', { customerName, address, phone, orderValue, deliveryFee });
    setCustomerName(''); setAddress(''); setPhone(''); setOrderValue(''); setDeliveryFee('');
    fetchData();
  };

  const handlePayMotoboy = async (id) => {
    if(!window.confirm('Confirmar o pagamento das corridas deste motoboy?')) return;
    try {
      const res = await api.put(`/finance/pay/${id}`);
      alert(res.data.message);
      fetchData();
    } catch(err) {
      alert('Erro ao pagar motoboy.');
    }
  };

  const handleAssignOrder = async (orderId, motoboyId) => {
    if (!motoboyId) return;
    await api.post('/orders/assign', { orderId, motoboyId });
    fetchData();
  };

  const handleOpenCreateMotoboy = () => {
    setEditMotoboyId(null);
    setMbName(''); setMbUsername(''); setMbPassword(''); setMbSalary(''); setMbMessage('');
    setIsModalOpen(true);
  };

  const handleOpenEditMotoboy = (m) => {
    setEditMotoboyId(m.id);
    setMbName(m.name); setMbUsername(m.username); setMbPassword(''); setMbSalary(m.salary || 0); setMbMessage('');
    setIsModalOpen(true);
  };

  const handleDeleteMotoboy = async (id) => {
    if (!window.confirm('Tem certeza que deseja apagar permanentemente este Motoboy? As entregas passadas ficarão anônimas no relátorio.')) return;
    try {
      await api.delete(`/motoboys/${id}`);
      fetchData();
      alert('Excluído com sucesso.');
    } catch (err) {
      alert('Erro ao excluir.');
    }
  };

  const handleSaveMotoboy = async (e) => {
    e.preventDefault();
    setIsCreating(true);
    setMbMessage('');
    try {
      if (editMotoboyId) {
        await api.put(`/motoboys/${editMotoboyId}`, { name: mbName, username: mbUsername, password: mbPassword, salary: mbSalary });
        setMbMessage('Atualizado com sucesso!');
      } else {
        await api.post('/auth/register', { name: mbName, username: mbUsername, password: mbPassword, salary: mbSalary });
        setMbMessage('Motoboy criado com sucesso!');
      }
      fetchData();
      setTimeout(() => {
        setMbMessage('');
        setIsModalOpen(false);
      }, 1500);
    } catch (err) {
      setMbMessage(err.response?.data?.error || 'Erro ao salvar. Verifique os dados.');
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
              {motoboys.filter(m => m.status === 'ONLINE').length}
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
          <div style={{flex: '1 1 150px'}}>
            <div className="input-group" style={{marginBottom: 0}}>
              <input type="number" step="0.01" placeholder="Valor do Pedido (R$)" value={orderValue} onChange={e => setOrderValue(e.target.value)} />
            </div>
          </div>
          <div style={{flex: '1 1 150px'}}>
            <div className="input-group" style={{marginBottom: 0}}>
              <input type="number" step="0.01" placeholder="Taxa Entrega (Automático se vazio)" value={deliveryFee} onChange={e => setDeliveryFee(e.target.value)} />
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
                    <div style={{ padding: '8px 16px', background: 'rgba(239, 68, 68, 0.1)', borderRadius: '8px', textAlign: 'center', border: '1px solid var(--status-red)', color: 'var(--status-red)', fontWeight: 500 }}>
                      Aguardando Aceite...
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
        <button className="btn btn-primary" style={{width: 'auto'}} onClick={handleOpenCreateMotoboy}>
          + Cadastrar Motoboy
        </button>
      </div>

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Todos os Motoboys ({motoboys.length})</h3>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {motoboys.map(m => (
            <li key={m.id} style={{ padding: '12px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <span style={{ fontWeight: 500, color: 'var(--text-dark)' }}>{m.name}</span>
                <span className={`badge ${m.status === 'ONLINE' ? 'delivered' : 'pending'}`} style={{fontSize: '0.7rem'}}>
                  {m.status === 'ONLINE' ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto' }} onClick={() => handleOpenEditMotoboy(m)}>
                  Editar
                </button>
                <button className="btn btn-outline" style={{ padding: '6px 12px', fontSize: '0.8rem', width: 'auto', borderColor: 'var(--status-red)', color: 'var(--status-red)' }} onClick={() => handleDeleteMotoboy(m.id)}>
                  Excluir
                </button>
              </div>
            </li>
          ))}
          {motoboys.length === 0 && <p className="text-light" style={{padding: '16px 0'}}>Nenhum motoboy cadastrado no sistema.</p>}
        </ul>
      </div>
    </>
  );

  const handleSaveConfig = async () => {
    try {
      await api.put('/config', { key: 'FIXED_FEE', value: fixedFee });
      alert('Taxa Fixa global salva com sucesso!');
    } catch(err) {
      alert('Erro ao salvar taxa fixa');
    }
  };

  const renderFinanceiro = () => (
    <>
      <h1 className="text-center" style={{marginBottom: '40px'}}>Financeiro Administrativo</h1>
      
      <div className="card" style={{ maxWidth: '900px', margin: '0 auto 24px' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Configurações Globais</h3>
        <div style={{ display: 'flex', alignItems: 'flex-end', gap: '16px', flexWrap: 'wrap' }}>
          <div className="input-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
            <label>Taxa Fixa de Entrega Padrão (R$)</label>
            <input type="number" step="0.01" placeholder="Ex: 5.00" value={fixedFee} onChange={e => setFixedFee(e.target.value)} />
          </div>
          <button className="btn btn-primary" style={{ width: 'auto' }} onClick={handleSaveConfig}>
            Salvar Taxa
          </button>
        </div>
        <p style={{ marginTop: '8px', fontSize: '0.85rem', color: 'var(--text-light)' }}>
          * Esta taxa será aplicada automaticamente a novas entregas caso o campo "Taxa Entrega" não seja preenchido manualmente.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '24px', maxWidth: '900px', margin: '0 auto', paddingBottom: '32px' }}>
        
        <div className="card text-center" style={{marginTop: '16px'}}>
          <div className="card-badge-top" style={{background: 'var(--primary-color)'}}>Movimento Total</div>
          <p style={{ fontSize: '2.5rem', color: 'var(--text-dark)', fontWeight: 'bold', margin: '16px 0 8px' }}>
            R$ {(financeData?.totalSystemValue || 0).toFixed(2).replace('.', ',')}
          </p>
          <p>Valor Total dos Pedidos (Itens)</p>
        </div>

        <div className="card text-center" style={{marginTop: '16px', border: '2px solid rgba(239, 68, 68, 0.4)'}}>
          <div className="card-badge-top" style={{background: 'var(--status-red)'}}>A Pagar</div>
          <p style={{ fontSize: '2.5rem', color: 'var(--status-red)', fontWeight: 'bold', margin: '16px 0 8px' }}>
            R$ {(financeData?.totalPendingToMotoboys || 0).toFixed(2).replace('.', ',')}
          </p>
          <p>Devendo aos Motoboys</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '900px', margin: '0 auto' }}>
        <h3 style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '12px', marginBottom: '16px' }}>Fechamento de Motoboys</h3>
        
        {financeData?.motoboys?.length === 0 ? (
          <p className="text-center" style={{padding: '24px 0', color: 'var(--text-light)'}}>Nenhum saldo pendente com motoboys.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {financeData?.motoboys?.map(m => (
              <li key={m.id} style={{ padding: '16px 0', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h4 style={{ margin: '0 0 4px 0', color: 'var(--text-dark)' }}>{m.name}</h4>
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-light)' }}>{m.pendingOrdersCount} entregas pendentes</span>
                </div>
                <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', display: 'block' }}>Taxas das Entregas</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--status-red)' }}>R$ {m.pendingBalance.toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', display: 'block' }}>Salário Fixo</span>
                    <span style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--text-dark)' }}>R$ {(m.salary || 0).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <div style={{ textAlign: 'right', borderLeft: '1px solid var(--border-color)', paddingLeft: '16px' }}>
                    <span style={{ fontSize: '0.85rem', color: 'var(--text-light)', display: 'block' }}>Total Geral</span>
                    <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>R$ {(m.pendingBalance + (m.salary || 0)).toFixed(2).replace('.', ',')}</span>
                  </div>
                  <button className="btn btn-green" style={{ width: 'auto', padding: '8px 16px', marginLeft: '8px' }} onClick={() => handlePayMotoboy(m.id)}>
                    Dar Baixa de Taxas
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
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
            <h3 style={{ marginBottom: '16px' }}>{editMotoboyId ? 'Editar Motoboy' : 'Cadastrar Motoboy'}</h3>
            
            {mbMessage && (
              <div style={{ padding: '12px', marginBottom: '16px', borderRadius: '8px', 
                backgroundColor: mbMessage.includes('Erro') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)', 
                color: mbMessage.includes('Erro') ? 'var(--status-red)' : 'var(--status-green)' 
              }}>
                {mbMessage}
              </div>
            )}

            <form onSubmit={handleSaveMotoboy}>
              <div className="input-group">
                <label>Nome Completo</label>
                <input required type="text" placeholder="Ex: João da Silva" value={mbName} onChange={e => setMbName(e.target.value)} disabled={isCreating} />
              </div>
              <div className="input-group">
                <label>Usuário de Login</label>
                <input required type="text" placeholder="ex: felipe_motoboy" value={mbUsername} onChange={e => setMbUsername(e.target.value)} disabled={isCreating} />
              </div>
              <div className="input-group">
                <label>Senha {editMotoboyId && '(Opcional se não for mudar)'}</label>
                <input type="password" required={!editMotoboyId} placeholder="Mínimo 6 caracteres" value={mbPassword} onChange={e => setMbPassword(e.target.value)} disabled={isCreating} />
              </div>
              <div className="input-group">
                <label>Salário / Fixo Contratual (R$)</label>
                <input type="number" step="0.01" placeholder="Deixe 0 se apenas ganhar por taxa" value={mbSalary} onChange={e => setMbSalary(e.target.value)} disabled={isCreating} />
              </div>
              <button type="submit" className="btn btn-primary" style={{ marginTop: '24px'}} disabled={isCreating}>
                {isCreating ? 'Aguarde...' : (editMotoboyId ? 'Salvar Alterações' : 'Finalizar Cadastro')}
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
