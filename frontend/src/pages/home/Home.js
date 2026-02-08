import React, { useState, useEffect } from 'react';
import api from '../../api/axios';
import TweetCard from '../../components/tweetcard/TweetCard';
import './Home.css';


function Home() {
    const [tweets, setTweets] = useState([]);
    const [content, setContent] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [editingPostId, setEditingPostId] = useState(null); // Čuvamo ID posta koji menjamo
   const [currentUser, setCurrentUser] = useState(null);

    const limit = 280;
    const isOverLimit = content.length > limit;

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

   
    useEffect(() => {
    const handler = () => fetchPosts();
    window.addEventListener('posts:refresh', handler);
    return () => window.removeEventListener('posts:refresh', handler);
    }, []); 
   // DODATO: Funkcija da saznamo ko si ti (tvoj ID)
    const fetchCurrentUser = async () => {
        try {
            const response = await api.get('/user');
            setCurrentUser(response.data);
        } catch (error) {
            console.error("Greška pri preuzimanju korisnika:", error);
        }
    };

    useEffect(() => {
        fetchPosts();
        fetchCurrentUser(); // Pozivamo pri učitavanju
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

    // const handlePostSubmit = async () => {
    //     if (!content.trim()) return;

    //     try {
    //         await api.post('/posts', { content: content });
    //         setContent('');
    //         fetchPosts();
    //     } catch (error) {
    //         alert("Došlo je do greške prilikom objavljivanja.");
    //     }
    // };


    // 1. Kada klikneš na dugme Edit u TweetCard-u
const handleEditInitiate = (postId, currentContent) => {
    setEditingPostId(postId);
    setContent(currentContent);
    window.scrollTo({ top: 0, behavior: 'smooth' }); // Skroluj do vrha da vidiš textarea
};

// 2. Modifikovani submit (sada radi i Create i Update)
const handlePostSubmit = async () => {
    if (!content.trim() || isOverLimit) return;

    try {
        if (editingPostId) {
            // Ako imamo ID, radimo UPDATE
            await api.put(`/posts/${editingPostId}`, { content: content });
            setEditingPostId(null);
        } else {
            // Ako nemamo ID, radimo CREATE
            await api.post('/posts', { content: content });
        }
        setContent('');
        fetchPosts();
    } catch (error) {
        console.error("Greška:", error);
        alert(error.response?.status === 403 ? "Niste autorizovani." : "Došlo je do greške.");
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
                            //authorId={tweet.user_id} 
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