import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import TweetCard from '../../components/tweetcard/TweetCard';
import './Profile.css';

function Profile() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState([]); // State za čuvanje tvojih postova


  const handleDeletePost = async (id) => {
    if (window.confirm('Da li ste sigurni da želite da obrišete ovu objavu?')) {
      try {
        await api.delete(`/posts/${id}`);
        setPosts(posts.filter(post => post.id !== id));
      } catch (err) {
        console.error("Greška pri brisanju:", err);
      }
    }
  };

   const fetchMe = async () => {
  try {
    const response = await api.get('/user');
    setUser(response.data);
  } catch (err) {
    console.error("Greška pri osvežavanju user-a:", err);
  }
};
  useEffect(() => {
  const handler = () => fetchMe();

  window.addEventListener('user:refresh', handler);

  return () => window.removeEventListener('user:refresh', handler);
}, []);



  useEffect(() => {
    const fetchUserData = async () => {
      if (!isLoggedIn) {
        setLoading(false);
        return;
      }

      try {
        const response = await api.get('/user');
        setUser(response.data);
        localStorage.setItem('user', JSON.stringify(response.data));
        localStorage.setItem('user_id', response.data.id);
        localStorage.setItem('user_role', response.data.role);

        const postsResponse = await api.get(`/posts?user_id=${response.data.id}`);
        setPosts(postsResponse.data.posts || []);
      } catch (err) {
        console.error("Greška pri preuzimanju podataka:", err);
        if (err.response?.status === 401) {
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [isLoggedIn]);

  useEffect(() => {
  const handler = async () => {
    if (!user?.id) return;

    const postsResponse = await api.get(`/posts?user_id=${user.id}`);
    setPosts(postsResponse.data.posts || []);
  };

  window.addEventListener('posts:refresh', handler);
  return () => window.removeEventListener('posts:refresh', handler);
}, [user?.id]);


  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setIsLoggedIn(false);
    navigate('/login');
  };

  if (loading) return <div className="loading">Učitavanje...</div>;

  if (!isLoggedIn) {
    return (
      <div className="profile-locked-overlay">
        <div className="locked-card">
          <div className="lock-icon">🔒</div>
          <h2>Pristup zabranjen</h2>
          <p>Morate biti deo mreže da biste pristupili profilu.</p>
          <button className="auth-submit-btn" onClick={() => navigate('/login')}>
            Prijavi se odmah
          </button>
          <p className="auth-footer-text" style={{ marginTop: '15px' }}>
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
          <button className="edit-profile-btn" onClick={handleLogout}>
            Odjavi se
          </button>
        </div>

        <div className="user-details">
          <h1 className="display-name">{user?.name || 'Korisnik'}</h1>
          <p className="username">@{user?.name?.toLowerCase().replace(/\s/g, '') || 'korisnik'}</p>
          
          <p className="bio">
            {user?.bio || 'Dobrodošli na vaš E-Twitter profil. Ovde možete deliti svoje misli sa svetom.'}
          </p>

          <div className="stats-row">
            <span><strong>{user?.following_count || 0}</strong> Prati</span>
            <span><strong>{user?.followers_count || 0}</strong> Pratilaca</span>
          </div>
        </div>

        <div className="profile-tabs">
          <div className="tab active">Objave</div>
          <div className="tab">Odgovori</div>
          <div className="tab">Mediji</div>
        </div>
      </div>

      <div className="profile-feed">
        {/* <p className="no-tweets">Vaše objave će se pojaviti ovde.</p> */}
        {posts.length > 0 ? (
          posts.map((tweet) => (
            <TweetCard
              key={tweet.id}
              postId={tweet.id}
            //  authorId={tweet.user_id}
              authorId={user?.id}
              currentUserId={user?.id}
              username={tweet.user?.name || user?.name}
              content={tweet.content}
              timestamp={new Date(tweet.created_at).toLocaleDateString()}
              onDelete={handleDeletePost} // Dodajemo funkciju za brisanje
            />
          ))
        ) : (
          <p className="no-tweets">Još uvek niste ništa objavili.</p>
        )}
      </div>
    </div>
  );
}

export default Profile;