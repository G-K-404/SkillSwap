import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, CircularProgress } from '@mui/material';
import Cookies from 'js-cookie';
import * as jose from 'jose';

const MatchHistory = () => {
  const [loading, setLoading] = useState(true);
  const [matches, setMatches] = useState([]);

  useEffect(() => {
    const token = Cookies.get('token');
    console.log('Token from cookie:', token);
    if (!token) {
      setLoading(false);
      return;
    }
    let userId;
    try {
      const payload = jose.decodeJwt(token);
      console.log('Decoded JWT payload:', payload);
      userId = payload.user.id;
      if (!userId) throw new Error('No userId in token');
    } catch (e) {
      setLoading(false);
      console.error('JWT decode error:', e);
      return;
    }
    // Only fetch if userId is present
    fetch('http://localhost:4000/api/matches?userId=' + userId, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => {
        if (!res.ok) throw new Error('Network response was not ok');
        return res.json();
      })
      .then(data => {
        setMatches(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        console.error('Fetch error:', err);
      });
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          color: '#00FF9F',
          backgroundColor: '#121212',
          padding: 2,
          height: '100%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#00FF9F' }} size={50} thickness={5} />
      </Box>
    );
  }

  return (
    <Box sx={{ color: 'white', backgroundColor: '#121212', padding: 2, height: '100%' }}>
      <Typography variant="h5" gutterBottom>
        My Matches
      </Typography>
      <List>
        {matches.map((match) => (
          <ListItem
            key={match.id}
            sx={{
              backgroundColor: '#1e1e1e',
              marginBottom: 1,
              borderRadius: 1,
            }}
          >
            <ListItemText
              primary={`With: ${match.username || match.name}`}
              secondary={`Status: ${match.status} | Match Score: ${match.match_score}`}
              primaryTypographyProps={{ sx: { color: 'white' } }}
              secondaryTypographyProps={{ sx: { color: 'gray' } }}
            />
          </ListItem>
        ))}
      </List>
    </Box>
  );
};

export default MatchHistory;
