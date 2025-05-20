import React, { useState, useEffect } from 'react';
import { Box, Typography, List, ListItem, ListItemText, CircularProgress } from '@mui/material';

const matches = [
  { name: 'Bob', status: 'Chatted', rating: 0.86 },
  { name: 'Jane', status: 'Ignored', rating: 0.32 },
];

const MatchHistory = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Simulate loading delay (e.g., fetching data)
    const timer = setTimeout(() => setLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          color: '#00FF9F',
          backgroundColor: '#121212',
          padding: 2,
          height:"100%", 
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
    <Box sx={{ color: 'white', backgroundColor: '#121212', padding: 2, height:"100%" }}>
      <Typography variant="h5" gutterBottom>
        My Matches
      </Typography>
      <List>
        {matches.map((match, i) => (
          <ListItem
            key={i}
            sx={{
              backgroundColor: '#1e1e1e',
              marginBottom: 1,
              borderRadius: 1,
            }}
          >
            <ListItemText
              primary={`With: ${match.name}`}
              secondary={`Status: ${match.status} | Rating: ${match.rating}`}
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
