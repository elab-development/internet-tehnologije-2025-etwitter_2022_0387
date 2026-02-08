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
  currentUserId
}) {
  const storageId = localStorage.getItem('user_id');
  const mojId = currentUserId || storageId;

  const isMyPost = mojId && Number(mojId) === Number(authorId);

  // follow/unfollow state
  const [isFollowing, setIsFollowing] = useState(Boolean(author?.is_following));

  // inline edit state
  const [isEditing, setIsEditing] = useState(false);
  const [editedContent, setEditedContent] = useState(content);

  const limit = 280;
  const isOverLimit = editedContent.length > limit;

  const canFollowThisAuthor =
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

      // 3) (opciono) da profil osveži brojače
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

      // refresh feed/profile da povuče novi sadržaj
      window.dispatchEvent(new Event('posts:refresh'));
    } catch (err) {
      const msg = err.response?.data?.message || 'Greška pri izmeni.';
      alert(msg);
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
                <button
                  className="action-btn"
                  onClick={handleCancelEdit}
                  style={{ border: '1px solid gray' }}
                >
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
        <button className="action-btn">Like</button>
        <button className="action-btn">Reply</button>
        <button className="action-btn">Share</button>

        {canFollowThisAuthor ? (
          <button
            className="action-btn"
            onClick={handleToggleFollow}
            style={{
              marginLeft: 'auto',
              border: '1px solid #7fff7f',
              padding: '2px 8px',
              borderRadius: '4px'
            }}
          >
            {isFollowing ? 'Unfollow' : 'Follow'}
          </button>
        ) : null}

        {isMyPost ? (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button
              className="action-btn edit-btn"
              onClick={handleEditClick}
              style={{ color: '#4da6ff', border: '1px solid #4da6ff', padding: '2px 8px', borderRadius: '4px' }}
            >
              Edit
            </button>
            <button
              className="action-btn delete-btn"
              onClick={() => onDelete(postId)}
              style={{ color: '#ff4d4d', fontWeight: 'bold', border: '1px solid #ff4d4d', padding: '2px 8px', borderRadius: '4px' }}
            >
              Delete
            </button>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export default TweetCard;
