import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  return (
    <div className="auth-screen">
      <div className="auth-card">
        <h2 className="auth-title">Prijavite se na E-Twitter</h2>
        
        <div className="auth-input-group">
          <label>Email adresa</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="ime@primer.com"
          />
        </div>

        <div className="auth-input-group">
          <label>Lozinka</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Vaša lozinka" 
          />
        </div>

        <button className="auth-submit-btn">Prijavi se</button>
        
        <p className="auth-footer-text">
          Nemate nalog? <span onClick={() => navigate('/signup')}>Registrujte se</span>
        </p>
      </div>
    </div>
  );
}

export default Login;