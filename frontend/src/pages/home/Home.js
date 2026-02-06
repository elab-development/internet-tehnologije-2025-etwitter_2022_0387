import TweetCard from '../../components/tweetcard/TweetCard';
import './Home.css';

function Home() {
  const mockTweets = [
    { id: 1, user: 'admin_sys', content: 'E-Twitter protokol je uspešno pokrenut. Svi sistemi su aktivni.', time: '02:44' },
    { id: 2, user: 'tara_blue', content: 'Komponente su ugnježdene. Plavi glow konačno radi kako treba!', time: '03:12' },
    { id: 3, user: 'guest_01', content: 'Testiram globalni feed... Da li me čujete?', time: '04:20' }
  ];

  return (
    <div className="feed-container">
      <div className="feed-header">
        <h2>Global Feed</h2>
        <div className="pulse-dot"></div>
      </div>
      
      <div className="composer-section">
        <textarea 
          placeholder="Share your thoughts..." 
          className="post-input"
        ></textarea>
        <div className="composer-actions">
          <button className="publish-btn">Post it!</button>
        </div>
      </div>

      <div className="main-feed">
        {mockTweets.map(tweet => (
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

export default Home;