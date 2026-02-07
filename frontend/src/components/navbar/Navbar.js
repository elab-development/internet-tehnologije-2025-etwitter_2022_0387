import { Link } from 'react-router-dom';
import './Navbar.css';
import React, { useState } from 'react';
import api from '../../api/axios';

function Navbar() {
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);

  // Funkcija koja traži korisnike dok kucaš
  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchTerm(value);

    if (value.length > 2) {
      try {
        const response = await api.get(`/users/search?query=${value}`);
        setSearchResults(response.data);
      } catch (err) {
        console.error("Greška pri pretrazi:", err);
      }
    } else {
      setSearchResults([]);
    }
  };

  // Funkcija za praćenje korisnika direktno iz pretrage
  const handleFollow = async (userId) => {
    try {
      await api.post(`/users/${userId}/follow`);
      alert("Uspešno zapraćeno!");
      setSearchTerm('');
      setSearchResults([]);
      window.location.reload(); // Osvežavamo da se pojave novi postovi na početnoj
    } catch (err) {
        const errorMessage = err.response?.data?.message || "Greška pri praćenju.";
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
                <button 
                  className="search-follow-btn" 
                  onClick={() => handleFollow(user.id)}
                >
                  Zaprati
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="nav-menu">
        <Link to="/" className="menu-item">Početna</Link>
        <Link to="/profile" className="menu-item">Profil</Link>
        <Link to="/login" className="menu-item">Prijava</Link>
      </div>
    </nav>
  );
}

export default Navbar;