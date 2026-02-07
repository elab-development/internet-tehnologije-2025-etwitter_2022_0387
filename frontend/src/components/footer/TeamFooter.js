
import React, { useState, useEffect } from 'react';
import './TeamFooter.css';

const TeamFooter = () => {
    const [teamMembers, setTeamMembers] = useState([]);

    useEffect(() => {
        fetch('http://127.0.0.1:8000/api/team', {
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json'
            }
        })
        .then(response => {
            if (!response.ok) {
                throw new Error('Problem sa odgovorom servera');
            }
            return response.json();
        })
        .then(data => {
            console.log("Podaci uspešno stigli:", data);
            setTeamMembers(data);
        })
        .catch(error => {
            console.error('Greška pri fetch-u:', error);
        });
    }, []); 

    return (
        <footer className="team-footer">
            <div className="footer-container">
                <h4 className="footer-title">Naš Razvojni Tim</h4>
                <div className="team-grid">
                    {teamMembers.map((member) => (
                        <div key={member.id} className="member-card">
                            <span className="member-name">{member.name}</span>
                            <a 
                                href={member.github} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="github-link"
                            >
                                GitHub Profil
                            </a>
                        </div>
                    ))}
                </div>
            </div>
        </footer>
    );
};

export default TeamFooter;