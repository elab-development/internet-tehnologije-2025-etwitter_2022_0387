import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import TweetCard from '../../components/tweetcard/TweetCard';
import './Home.css';



function Home() {
    const [tweets, setTweets] = useState([]);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const limit = 280;
    const isOverLimit = content.length > limit;

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
//Funkcija za brisanje tweeta
    const handleDelete = async (postId) => {
        if (window.confirm("Da li ste sigurni da želite da obrišete ovaj post?")) {
            try {
                await api.delete(`/posts/${postId}`);
                setTweets(tweets.filter(t => t.id !== postId));
            } catch (error) {
                console.error("Greška pri brisanju:", error);
                alert("Niste autorizovani da obrišete ovaj post.");
            }
        }
    };

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
                    className={`post-input ${isOverLimit ? 'input-error' : ''}`} // Dodajemo klasu za crveni okvir
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    style={{
                        borderColor: isOverLimit ? '#e02424' : '#ccc', // Direktno crvena boja ako pređe limit
                        width: '100%',
                        padding: '10px'
                    }}
                    // className="post-input"
                    // value={content}
                    // onChange={(e) => setContent(e.target.value)}
                    // maxLength={280}
                ></textarea>
                <div className="composer-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                    
                    {/* CRVENA PORUKA KOJA SE POJAVLJUJE SAMO KAD PREĐE 280 */}
                    {isOverLimit && (
                        <span style={{ color: '#e02424', fontSize: '13px', marginBottom: '5px', fontWeight: 600 }}>
                            ⚠️ Ne možete uneti više od 280 karaktera!
                        </span>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {/* BROJAČ KOJI CRVENI */}
                        <span style={{ color: isOverLimit ? '#e02424' : '#666' }}>
                            {content.length} / {limit}
                        </span>

                        <button 
                            className="publish-btn" 
                            onClick={handlePostSubmit}
                            disabled={isLoading || content.length === 0 || isOverLimit}
                            style={{
                                opacity: isOverLimit ? 0.5 : 1,
                                cursor: isOverLimit ? 'not-allowed' : 'pointer'
                            }}
                        >
                            {isLoading ? 'Posting...' : 'Post it!'}
                        </button>
                    </div>
              </div>
            </div>

            <div className="main-feed">
                {tweets.length > 0 ? (
                    tweets.map(tweet => (
                        <TweetCard 
                            key={tweet.id} 
                            postId={tweet.id}       
                            authorId={tweet.user_id} 
                            onDelete={handleDelete}
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