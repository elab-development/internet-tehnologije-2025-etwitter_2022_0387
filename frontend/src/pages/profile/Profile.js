import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TweetCard from '../../components/tweetcard/TweetCard';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  
  // State koji prati da li je korisnik ulogovan
  const [isLoggedIn, setIsLoggedIn] = useState(false); 

  // Podaci koji će se prikazati tek kad se uloguješ
  const user = {
    username: 'korisnik_mreze',
    displayName: 'Vaš Profil',
    bio: 'Dobrodošli na vaš E-Twitter profil. Ovde možete deliti svoje misli sa svetom.',
    joined: 'Februar 2026',
    following: 150,
    followers: 2400
  };

  const myTweets = [
    { id: 1, user: user.username, content: 'Moj prvi post nakon prijave! 🚀', time: '1m' }
  ];

  // Funkcija koja simulira prijavu (kasnije ćeš ovde imati pravu logiku)
  const handleLoginSim = () => {
    setIsLoggedIn(true);
  };

  if (!isLoggedIn) {
    return (
      <div className="profile-locked-overlay">
        <div className="locked-card">
          <div className="lock-icon">🔒</div>
          <h2>Pristup zabranjen</h2>
          <p>Morate biti deo mreže da biste pristupili željenim podacima i objavama.</p>
          <button className="auth-submit-btn" onClick={handleLoginSim}>
            Prijavi se odmah
          </button>
          <p className="auth-footer-text" style={{marginTop: '15px'}}>
            Nemate nalog? <span onClick={() => navigate('/signup')}>Registrujte se</span>
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-container">
      <div className="profile-header">
        <div className="cover-photo"></div>
        <div className="profile-info-section">
          <div className="avatar-holder"></div>
          <button className="edit-profile-btn" onClick={() => setIsLoggedIn(false)}>
            Odjavi se
          </button>
        </div>
        
        <div className="user-details">
          <h1 className="display-name">{user.displayName}</h1>
          <p className="username">@{user.username}</p>
          <p className="bio">{user.bio}</p>
          
          <div className="stats-row">
            <span><strong>{user.following}</strong> Prati</span>
            <span><strong>{user.followers}</strong> Pratilaca</span>
          </div>
        </div>

        <div className="profile-tabs">
          <div className="tab active">Objave</div>
          <div className="tab">Odgovori</div>
          <div className="tab">Mediji</div>
        </div>
      </div>

      <div className="profile-feed">
        {myTweets.map(tweet => (
          <TweetCard 
            key={tweet.id} 
            username={tweet.user} 
            content={tweet.content} 
            timestamp={tweet.time}
          />
        ))}
      </div>
    </div>
  );
}

export default Profile;