import React, { useEffect, useState } from 'react';
import api from '../../api/axios';
import TweetCard from '../../components/tweetcard/TweetCard';
import { useNavigate } from 'react-router-dom';

function ModeratorPanel() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const role = localStorage.getItem('user_role');
  const token = localStorage.getItem('token');

  useEffect(() => {
    if (!token) {
      navigate('/login');
      return;
    }
    if (role !== 'moderator') {
      navigate('/');
      return;
    }
  }, [token, role, navigate]);

  const fetchReported = async () => {
    setLoading(true);
    try {
      const res = await api.get('/moderator/reported-posts');
      setPosts(res.data.posts || []);
    } catch (err) {
      alert(err.response?.data?.message || 'Greška pri učitavanju reportovanih objava.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReported();
  }, []);

  const approveDelete = async (postId) => {
    if (!window.confirm('Odobri brisanje ove objave?')) return;
    try {
      await api.post(`/moderator/posts/${postId}/approve-delete`);
      setPosts(prev => prev.filter(p => p.id !== postId));
      // osveži feed kod drugih otvorenih tabova
      window.dispatchEvent(new Event('posts:refresh'));
    } catch (err) {
      alert(err.response?.data?.message || 'Greška pri brisanju.');
    }
  };

  const dismiss = async (postId) => {
    if (!window.confirm('Odbaci prijavu (dismiss)?')) return;
    try {
      await api.post(`/moderator/posts/${postId}/dismiss`);
      setPosts(prev => prev.filter(p => p.id !== postId));
    } catch (err) {
      alert(err.response?.data?.message || 'Greška pri dismiss.');
    }
  };

  if (loading) return <div style={{ padding: 20 }}>Učitavanje...</div>;

  return (
    <div style={{ padding: 20, maxWidth: 900, margin: '0 auto' }}>
      <h2>Reportovane objave</h2>

      {posts.length === 0 ? (
        <p>Nema prijavljenih objava.</p>
      ) : (
        posts.map((p) => (
          <div key={p.id} style={{ marginBottom: 16 }}>
            <TweetCard
                compact={true}
              postId={p.id}
              authorId={p.user?.id}
              currentUserId={null}
              username={p.user?.name || 'Korisnik'}
              content={p.content}
              timestamp={new Date(p.created_at).toLocaleString()}
              onDelete={() => {}} // ne koristi se ovde
            />

            <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
              <button
                className="action-btn"
                onClick={() => approveDelete(p.id)}
                style={{ border: '1px solid #ff4d4d', color: '#ff4d4d' }}
              >
                Approve delete
              </button>

              <button
                className="action-btn"
                onClick={() => dismiss(p.id)}
                style={{ border: '1px solid #4da6ff', color: '#4da6ff' }}
              >
                Dismiss
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}

export default ModeratorPanel;