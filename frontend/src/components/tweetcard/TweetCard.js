import './TweetCard.css';

function TweetCard({ username, content, timestamp, authorId, postId, onDelete, onEdit, currentUserId}) {
//  const currentUserId = localStorage.getItem('user_id');
  const storageId = localStorage.getItem('user_id');
  const propId = currentUserId;
  const mojId = propId || storageId;
  const isMyPost = mojId && Number(mojId) === Number(authorId);
  return (
    <div className="cyber-card">
      <div className="card-header">
        <span className="user-id">{username}</span>
        <span className="timestamp">{timestamp}</span>
      </div>
      <div className="card-body">
        <p className="tweet-text">{content}</p>
      </div>
      <div className="card-footer">
        <button className="action-btn">Like</button>
        <button className="action-btn">Reply</button>
        <button className="action-btn">Share</button>

    {isMyPost ? (
          <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
            <button 
              className="action-btn edit-btn" 
              onClick={onEdit}
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