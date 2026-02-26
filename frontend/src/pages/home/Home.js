import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import axios from 'axios';
import TweetCard from '../../components/tweetcard/TweetCard';
import { Link } from 'react-router-dom'; // Potrebno za dugmiće na baneru
import './Home.css';


function Home() {
    const [tweets, setTweets] = useState([]);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null);
    const [currentUser, setCurrentUser] = useState(null);
    const [externalEmojis, setExternalEmojis] = useState([]);
    const [showPicker, setShowPicker] = useState(false);

    const fetchEmojis = async () => {
    if (externalEmojis.length > 0) return; // Da ne učitava svaki put
    try {
        // Koristimo eksterni API
        const response = await axios.get('https://emoji-api.com/emojis?access_key=2cd16972a844bd5061bbe48dd7490a13c9d1818a');
        setExternalEmojis(response.data.slice(0, 100)); // Uzimamo prvih 100 radi brzine
    } catch (error) {
        console.error("Greška pri povlačenju emojija:", error);
    }
    };

    const togglePicker = () => {
        setShowPicker(!showPicker);
        if (!showPicker) fetchEmojis();
    };
    // Definisanje tokena za proveru autentičnosti
    const token = localStorage.getItem('token');
    const limit = 280;
    const isOverLimit = content.length > limit;

    // Provera da li je ulogovani korisnik admin
    const isAdmin = currentUser?.role === 'admin';

    const fetchPosts = async () => {
        setIsLoading(true);
        try {
            const response = await api.get(`/posts?ttl=1&ts=${Date.now()}`);
            const data = response.data.posts || [];
            setTweets(data);
        } catch (error) {
            console.error("Greška pri učitavanju:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchCurrentUser = async () => {
        
        try {
            const response = await api.get('/user');
            setCurrentUser(response.data);
            localStorage.setItem('user', JSON.stringify(response.data));
            localStorage.setItem('user_id', response.data.id);
            
            localStorage.setItem('user_role', response.data.role);
        } catch (error) {
            console.error("Greška pri preuzimanju korisnika:", error);
        }
    };

    useEffect(() => {
        // Pozivaj funkcije samo ako korisnik ima token
        if (token) {
            fetchPosts();
            fetchCurrentUser();
        }
    }, [token]);

    useEffect(() => {
        const handler = () => fetchPosts();
        window.addEventListener('posts:refresh', handler);
        return () => window.removeEventListener('posts:refresh', handler);
    }, []);

    const handleDelete = async (postId) => {
        if (window.confirm("Da li ste sigurni da želite da obrišete ovaj post?")) {
            try {
                await api.delete(`/posts/${postId}`);
                setTweets(tweets.filter(t => t.id !== postId));
            } catch (error) {
                console.error("Greška pri brisanju:", error);
                alert("Došlo je do greške pri brisanju.");
            }
        }
    };

    const handleEditInitiate = (postId, currentContent) => {
        if (isAdmin) return; 
        setEditingPostId(postId);
        setContent(currentContent);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handlePostSubmit = async () => {
        if (!content.trim() || isOverLimit || isAdmin) return;

        try {
            if (editingPostId) {
                await api.put(`/posts/${editingPostId}`, { content: content });
                setEditingPostId(null);
            } else {
                await api.post('/posts', { content: content });
            }
            setContent('');
            fetchPosts();
        } catch (error) {
            console.error("Greška:", error);
            alert(error.response?.status === 403 ? "Niste autorizovani." : "Došlo je do greške.");
        }
    };

    // --- DODATO: Logika za neulogovanog korisnika ---
    if (!token) {
    return (
        <div className="guest-welcome-container">
            <div className="guest-banner">
                {}
                <img src="/logo.png" alt="E-Twitter Logo" className="guest-logo" />
                <h1>Poveži se sa svetom.</h1>
                <p>Podeli svoje misli, prati omiljene autore i budi deo globalne diskusije. Tvoja priča počinje ovde.</p>
                <div className="guest-buttons">
                    <Link to="/signup" className="guest-btn register">REGISTRUJ SE</Link>
                    <Link to="/login" className="guest-btn login">PRIJAVI SE</Link>
                </div>
            </div>
        </div>
    );
}

    return (
        <div className="feed-container">
            <div className="feed-header">
                <h2>Global Feed</h2>
                <div className={`pulse-dot ${isLoading ? 'loading' : ''}`}></div>
            </div>
            
            {!isAdmin && (
                <div className="composer-section">
                    <textarea 
                        placeholder="Share your thoughts..." 
                        className={`post-input ${isOverLimit ? 'input-error' : ''}`}
                        value={content}
                        onChange={(e) => setContent(e.target.value)}
                        style={{
                            borderColor: isOverLimit ? '#e02424' : '#ccc',
                            width: '100%',
                            padding: '10px'
                        }}
                    ></textarea>
                    <div className="composer-actions" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end' }}>
                        {/* --- OVDE DODAJEMO EMOJI DEO --- */}
    <div style={{ alignSelf: 'flex-start', position: 'relative', marginBottom: '10px' }}>
        <button 
            type="button" 
            onClick={() => {
                setShowPicker(!showPicker);
                if(!showPicker) fetchEmojis();
            }}
            style={{ background: 'transparent', border: '1px solid #4da6ff', color: '#4da6ff', cursor: 'pointer', padding: '2px 8px', borderRadius: '4px' }}
        >
            😊 Add Emoji
        </button>

        {showPicker && (
            <div style={{ 
                position: 'absolute', 
                top: '30px', 
                left: 0, 
                zIndex: 1000, 
                background: '#ffffff', 
                border: '1px solid #4da6ff', 
                width: '250px', 
                height: '200px', 
                overflowY: 'auto',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '5px',
                padding: '10px'
            }}>
                {externalEmojis.map(emoji => (
                    <span 
                        key={emoji.slug} 
                        onClick={() => {
                            setContent(prev => prev + emoji.character);
                            setShowPicker(false);
                        }}
                        style={{ cursor: 'pointer', fontSize: '20px' }}
                    >
                        {emoji.character}
                    </span>
                ))}
            </div>
        )}
    </div>
                        {isOverLimit && (
                            <span style={{ color: '#e02424', fontSize: '13px', marginBottom: '5px', fontWeight: 600 }}>
                                ⚠️ Ne možete uneti više od 280 karaktera!
                            </span>
                        )}

                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
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
                                {isLoading ? 'Posting...' : (editingPostId ? 'Update Post' : 'Post it!')}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="main-feed">
                {tweets.length > 0 ? (
                    tweets.map(tweet => (
                        <TweetCard 
                            key={tweet.id} 
                            postId={tweet.id}      
                            author={tweet.user}  
                            authorId={tweet.user?.id}
                            currentUserId={currentUser?.id} 
                            onDelete={handleDelete}
                            username={tweet.user?.name || 'Korisnik'} 
                            content={tweet.content} 
                            timestamp={new Date(tweet.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            onEdit={() => handleEditInitiate(tweet.id, tweet.content)}
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