import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress } from '@mui/material';
import MatchCard from '../components/MatchCard';
import Cookies from 'js-cookie';
import * as jose from 'jose';

const mlApiUrl = import.meta.env.VITE_ML_API_URL;

const BestMatches = () => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    // Fetch best matches from ML API
    const token = Cookies.get('token');
    let userId = null;
    try {
      if (token) {
        const payload = jose.decodeJwt(token);
        userId = payload.user.id;
      }
    } catch {}
    if (!userId) {
      setLoading(false);
      return;
    }
    fetch(`${mlApiUrl}/matches/${userId}?top_k=5`)
      .then(res => res.json())
      .then(data => {
        // data should be an array of users: { user_id, name, similarity }
        setMatches(data.map(u => ({
          user_id: u.user_id,
          name: u.name,
          matchScore: Math.round(u.similarity * 100),
          teachSkills: u.teachSkills || [],
          learnSkills: u.learnSkills || []
        })));
        setLoading(false);
      })
      .catch(() => {
        setMatches([]);
        setLoading(false);
      });
  }, []);

  return (
    <Box sx={{ minHeight: '100vh', background: '#1E1E1E', color: 'white', p: 4 }}>
      <Typography variant="h4" sx={{ color: '#00FF9F', mb: 3, fontWeight: 700 }}>Best Matches For You</Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 200 }}>
          <CircularProgress sx={{ color: '#00FF9F' }} />
        </Box>
      ) : (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, justifyContent: 'center' }}>
          {matches.map((user, idx) => (
            <Box key={idx} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <MatchCard {...user} />
              <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
                <button style={{
                  background: '#00FF9F', color: '#232323', border: 'none', borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 15
                }}>Message</button>
                <button style={{
                  background: '#232323', color: '#00FF9F', border: '2px solid #00FF9F', borderRadius: 6, padding: '8px 18px', fontWeight: 700, cursor: 'pointer', fontSize: 15
                }}>Profile</button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default BestMatches;
