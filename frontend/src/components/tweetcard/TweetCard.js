import './TweetCard.css';

function TweetCard({ username, content, timestamp }) {
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
      </div>
    </div>
  );
}

export default TweetCard;