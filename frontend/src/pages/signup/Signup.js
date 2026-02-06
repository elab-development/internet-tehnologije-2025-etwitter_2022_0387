import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './Signup.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  return (
    <div className="auth-screen">
      <div className="auth-card signup-variant">
        <h2 className="auth-title">Pridruži se E-Twitteru</h2>
        
        <div className="auth-input-group">
          <label>Korisničko ime</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="npr. petar_petrovic" 
          />
        </div>

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
            placeholder="Kreiraj sigurnu lozinku" 
          />
        </div>

        <button className="auth-submit-btn">Kreiraj nalog</button>
        
        <p className="auth-footer-text">
          Već imate nalog? <span onClick={() => navigate('/login')}>Prijavite se</span>
        </p>
      </div>
    </div>
  );
}

export default Signup;