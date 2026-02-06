import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import TweetCard from '../../components/tweetcard/TweetCard';
import './Home.css';

function Home() {
    const [tweets, setTweets] = useState([]);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const response = await api.get('/posts');
            const data = response.data.data || response.data;
            setTweets(data);
        } catch (error) {
            console.error("Greška pri učitavanju:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchPosts();
    }, []);

    const handlePostSubmit = async () => {
        if (!content.trim()) return;

        try {
            await api.post('/posts', { content: content });
            setContent('');
            fetchPosts();
        } catch (error) {
            alert("Došlo je do greške prilikom objavljivanja.");
        }
    };

    return (
        <div className="feed-container">
            <div className="feed-header">
                <h2>Global Feed</h2>
                <div className={`pulse-dot ${isLoading ? 'loading' : ''}`}></div>
            </div>
            
            <div className="composer-section">
                <textarea 
                    placeholder="Share your thoughts..." 
                    className="post-input"
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                ></textarea>
                <div className="composer-actions">
                    <button 
                        className="publish-btn" 
                        onClick={handlePostSubmit}
                        disabled={isLoading}
                    >
                        {isLoading ? 'Posting...' : 'Post it!'}
                    </button>
                </div>
            </div>

            <div className="main-feed">
                {tweets.length > 0 ? (
                    tweets.map(tweet => (
                        <TweetCard 
                            key={tweet.id} 
                            username={tweet.user?.name || 'Korisnik'} 
                            content={tweet.content} 
                            timestamp={new Date(tweet.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        />
                    ))
                ) : (
                    <p className="no-tweets">Još uvek nema postova na feed-u.</p>
                )}
            </div>
        </div>
    );
}

export default Home;