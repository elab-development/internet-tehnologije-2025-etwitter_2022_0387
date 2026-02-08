import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';
import React, { useState } from 'react';
import api from '../../api/axios';

function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const navigate = useNavigate();

  // Provera statusa ulogovanog korisnika
  const token = localStorage.getItem('token');
  const userString = localStorage.getItem('user');
  const currentUser = userString ? JSON.parse(userString) : null;
  const isAdmin = currentUser?.role === 'admin';

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 2) {
      try {
        const response = await api.get(`/users/search?query=${value}`);
        setSearchResults(response.data.data ?? response.data);
      } catch (err) {
        console.error("Greška pri pretrazi:", err);
      }
    } else {
      setSearchResults([]);
    }
  };

  const handleToggleFollow = async (user) => {
    if (isAdmin) return; // Admin ne može da prati
    try {
      if (user.is_following) {
        await api.delete(`/users/${user.id}/follow`);
      } else {
        await api.post(`/users/${user.id}/follow`);
      }

      setSearchResults(prev =>
        prev.map(u => u.id === user.id ? { ...u, is_following: !u.is_following } : u)
      );

      window.dispatchEvent(new Event('user:refresh'));
    } catch (err) {
      const errorMessage = err.response?.data?.message || "Greška.";
      alert(errorMessage);
    }
  };

  return (
    <nav className="main-navbar">
      <Link to="/" className="nav-logo">
        E-TWITTER
      </Link>
      
      <div className="nav-search-wrapper">
        <input
          type="text"
          className="nav-search-input"
          placeholder="Pretraži ljude..."
          value={searchTerm}
          onChange={handleSearch}
        />
        
        {searchResults.length > 0 && (
          <div className="nav-search-dropdown">
            {searchResults.map((user) => (
              <div key={user.id} className="nav-search-item">
                <span className="search-user-name">{user.name}</span>
                {/* Admin ne vidi Follow dugme */}
                {!isAdmin && (
                  <button
                    className="search-follow-btn"
                    onClick={() => handleToggleFollow(user)}
                  >
                    {user.is_following ? 'Unfollow' : 'Follow'}
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="nav-menu">
        <Link to="/" className="menu-item">Početna</Link>
        
        {/* USLOVNO RENDEROVANJE: */}
        {token ? (
          <>
            <Link to="/profile" className="menu-item">Profil</Link>
            {/* Opciono: Dugme za brzu odjavu */}
            <span 
              className="menu-item" 
              style={{cursor: 'pointer', color: '#ff4444'}}
              onClick={() => {
                localStorage.clear();
                window.location.href = '/login';
              }}
            >
              Odjavi se
            </span>
          </>
        ) : (
          <>
            <Link to="/login" className="menu-item">Prijava</Link>
            <Link to="/signup" className="menu-item">Registracija</Link>
          </>
        )}
      </div>
    </nav>
  );
}

export default Navbar;