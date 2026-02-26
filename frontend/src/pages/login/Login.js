import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import './Login.css';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/login', {
        email: email,
        password: password
      });

      // 1. Koristimo access_token (kako je definisano u tvom AuthControlleru)
      const token = response.data.access_token; 
     // localStorage.setItem('token', token);
      localStorage.setItem('token', response.data.access_token);

      if (response.data.user) {
        localStorage.setItem('user', JSON.stringify(response.data.user));
        localStorage.setItem('user_id', response.data.user.id);
        localStorage.setItem('user_role', response.data.user.role);
      }
      // 2. Čuvamo podatke o korisniku da bi Profil mogao odmah da ih učita
      // Tvoj kontroler vraća korisnika u response.data (ili response.data.user zavisi od API-ja)
      // Ako tvoj profil koristi api.get('/user'), ovo je super 'keš' za brzinu
      localStorage.setItem('user', JSON.stringify(response.data.user || response.data));

      alert("Uspešno ste se prijavili!");
      navigate('/'); 
    } catch (error) {
      console.error("Greška pri prijavi:", error.response?.data);
      alert(error.response?.data?.message || "Pogrešan email ili lozinka");
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleLogin}>
        <h2 className="auth-title">Prijavite se na E-Twitter</h2>
        
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
            placeholder="Vaša lozinka" 
            required 
          />
        </div>

        <button type="submit" className="auth-submit-btn">Prijavi se</button>
        
        <p className="auth-footer-text">
          Nemate nalog? <span onClick={() => navigate('/signup')} style={{cursor: 'pointer'}}>Registrujte se</span>
        </p>
      </form>
    </div>
  );
}

export default Login;