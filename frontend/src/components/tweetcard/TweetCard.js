import './TweetCard.css';
import React, { useEffect, useState } from 'react';
import api from '../../api/axios';

function TweetCard({
  username,
  content,
  timestamp,
  authorId,
  author,
  postId,
  onDelete,
  currentUserId,
   compact = false,
}) {
  const storageId = localStorage.getItem('user_id');
  const userRole = localStorage.getItem('user_role'); // Pretpostavka da čuvaš rolu u localStorage
  
  const mojId = currentUserId || storageId;
  const isAdmin = userRole === 'admin';

  const isModerator = userRole === 'moderator';

  const isMyPost = mojId && Number(mojId) === Number(authorId);

  // follow/unfollow state
  const [isFollowing, setIsFollowing] = useState(Boolean(author?.is_following));

  // inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const limit = 280;
  const isOverLimit = editedContent.length > limit;

  // Admin ne može da prati nikoga, a običan user ne prati admina
  const canFollowThisAuthor =
    !isAdmin && 
    Boolean(authorId) &&
    !isMyPost &&
    author?.role !== 'admin';

  useEffect(() => {
    setEditedContent(content);
  }, [content]);

  useEffect(() => {
    const handler = (e) => {
      const detail = e.detail || {};
      const userId = Number(detail.userId);
      const next = Boolean(detail.isFollowing);

      if (Number(authorId) === userId) {
        setIsFollowing(next);
      }
    };

    window.addEventListener('follow:changed', handler);
    return () => window.removeEventListener('follow:changed', handler);
  }, [authorId]);

  const handleToggleFollow = async () => {
    try {
      const next = !isFollowing;
      if (isFollowing) {
        await api.delete(`/users/${authorId}/follow`);
      } else {
        await api.post(`/users/${authorId}/follow`);
      }
      setIsFollowing(next);

      window.dispatchEvent(
        new CustomEvent('follow:changed', {
          detail: { userId: Number(authorId), isFollowing: next },
        })
      );
      window.dispatchEvent(new Event('user:refresh'));
    } catch (err) {
      const msg = err.response?.data?.message || 'Greška.';
      alert(msg);
    }
  };

  const handleEditClick = () => {
    setIsEditing(true);
    setEditedContent(content);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedContent(content);
  };

  const handleSaveEdit = async () => {
    if (!editedContent.trim() || isOverLimit) return;
    try {
      await api.put(`/posts/${postId}`, { content: editedContent });
      setIsEditing(false);
      window.dispatchEvent(new Event('posts:refresh'));
    } catch (err) {
      const msg = err.response?.data?.message || 'Greška pri izmeni.';
      alert(msg);
    }
  };

  const handleReport = async () => {
  if (!window.confirm('Da li želite da prijavite ovu objavu?')) return;

  try {
    const res = await api.post(`/posts/${postId}/report`);
    alert(res.data?.message || 'Objava je prijavljena.');
  } catch (err) {
    alert(err.response?.data?.message || 'Greška pri prijavi objave.');
  }
};

  return (
    <div className="cyber-card">
      <div className="card-header">
        <span className="user-id">{username}</span>
        <span className="timestamp">{timestamp}</span>
      </div>

      <div className="card-body">
        {isEditing ? (
          <div style={{ width: '100%' }}>
            <textarea
              value={editedContent}
              onChange={(e) => setEditedContent(e.target.value)}
              style={{
                width: '100%',
                maxWidth: '100%',
                boxSizing: 'border-box',
                minHeight: '80px',
                padding: '10px',
                borderRadius: '6px',
                border: isOverLimit ? '2px solid #e02424' : '1px solid #ccc'
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
              <span style={{ color: isOverLimit ? '#e02424' : '#666' }}>
                {editedContent.length} / {limit}
              </span>
              <div style={{ display: 'flex', gap: '10px' }}>
                <button className="action-btn" onClick={handleCancelEdit} style={{ border: '1px solid gray' }}>
                  Cancel
                </button>
                <button
                  className="action-btn"
                  onClick={handleSaveEdit}
                  disabled={!editedContent.trim() || isOverLimit}
                  style={{
                    border: '1px solid #4da6ff',
                    color: '#4da6ff',
                    opacity: (!editedContent.trim() || isOverLimit) ? 0.6 : 1
                  }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        ) : (
          <p className="tweet-text">{content}</p>
        )}
      </div>

      <div className="card-footer">
        {!compact && (
  <div className="card-footer">
    {/* INTERAKCIJE: Sakrivamo ako je korisnik ADMIN */}
    {!isAdmin && (
      <>
        <button className="action-btn">Like</button>
        <button className="action-btn">Reply</button>
        <button className="action-btn">Share</button>

        {/* REPORT: samo obican user i nije moj post */}
        {!isModerator && !isMyPost && (
          <button
            className="action-btn"
            onClick={handleReport}
            style={{ border: '1px solid #ffb84d', color: '#ffb84d' }}
          >
            Report
          </button>
        )}
      </>
    )}

    {/* FOLLOW: Samo za obične korisnike */}
    {canFollowThisAuthor && (
      <button
        className="action-btn"
        onClick={handleToggleFollow}
        style={{
          marginLeft: isAdmin ? 'auto' : '10px',
          border: '1px solid #7fff7f',
          padding: '2px 8px',
          borderRadius: '4px'
        }}
      >
        {isFollowing ? 'Unfollow' : 'Follow'}
      </button>
    )}

    {/* DELETE LOGIKA: Prikazujemo ako je MOJ post ILI ako sam ADMIN */}
    {(isMyPost || isAdmin) && (
      <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
        {isMyPost && !isAdmin && (
          <button
            className="action-btn edit-btn"
            onClick={handleEditClick}
            style={{ color: '#4da6ff', border: '1px solid #4da6ff', padding: '2px 8px', borderRadius: '4px' }}
          >
            Edit
          </button>
        )}

        <button
          className="action-btn delete-btn"
          onClick={() => onDelete(postId)}
          style={{ color: '#ff4d4d', fontWeight: 'bold', border: '1px solid #ff4d4d', padding: '2px 8px', borderRadius: '4px' }}
        >
          Delete
        </button>
      </div>
    )}
  </div>
)}
        
      </div>
    </div>
  );
}

export default TweetCard;