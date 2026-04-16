import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
  e.preventDefault();
  try {
    const res = await axios.post(
      'https://delivery-system-production-6da2.up.railway.app/api/auth/login',
      { email, password }
    );

    console.log(res.data); // ✅ AQUI SIM

    localStorage.setItem('token', res.data.token);
    localStorage.setItem('role', res.data.role);
    localStorage.setItem('name', res.data.name);

    if (res.data.role === 'ADMIN') {
      navigate('/admin');
    } else {
      navigate('/motoboy');
    }

  } catch (err) {
    setError(err.response?.data?.error || 'Erro ao efetuar login');
  }
};

  return (
    <div className="container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
      <div className="card" style={{ maxWidth: '400px', width: '100%' }}>
        <h2 style={{ textAlign: 'center', marginBottom: '24px' }}>Sistema de Entregas</h2>
        {error && <p style={{ color: 'var(--status-red)', textAlign: 'center', marginBottom: '16px' }}>{error}</p>}
        <form onSubmit={handleLogin}>
          <div className="input-group">
            <label>E-mail</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="Seu email" />
          </div>
          <div className="input-group">
            <label>Senha</label>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Sua senha" />
          </div>
          <button type="submit" className="btn btn-primary" style={{ marginTop: '24px' }}>Entrar</button>
        </form>
      </div>
    </div>
  );
}

export default Login;
