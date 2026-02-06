import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios'; 
import './Signup.css';

function Signup() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/register', {
        name: username,
        email: email,
        password: password,
        password_confirmation: password 
      });

      if (response.data.access_token) {
        localStorage.setItem('token', response.data.access_token);
        localStorage.setItem('user', JSON.stringify(response.data.data)); 
        
        alert("Uspešna registracija!");
        navigate('/'); 
      } else {
        alert("Greška: " + JSON.stringify(response.data));
      }
    } catch (err) {
      alert("Greška na serveru. Proveri konzolu.");
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card signup-variant" onSubmit={handleSignup}>
        <h2 className="auth-title">Pridruži se E-Twitteru</h2>
        
        <div className="auth-input-group">
          <label>Korisničko ime</label>
          <input 
            type="text" 
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="npr. petar_petrovic" 
            required
          />
        </div>

        <div className="auth-input-group">
          <label>Email adresa</label>
          <input 
            type="email" 
            value={email} 
            onChange={(e) => setEmail(e.target.value)} 
            placeholder="ime@primer.com"
            required
          />
        </div>

        <div className="auth-input-group">
          <label>Lozinka</label>
          <input 
            type="password" 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Kreiraj sigurnu lozinku" 
            required
          />
        </div>

        <button type="submit" className="auth-submit-btn">Kreiraj nalog</button>
        
        <p className="auth-footer-text">
          Već imate nalog? <span onClick={() => navigate('/login')} style={{cursor: 'pointer'}}>Prijavite se</span>
        </p>
      </form>
    </div>
  );
}

export default Signup;