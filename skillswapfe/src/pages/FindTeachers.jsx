import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, Rating, Button, CircularProgress } from '@mui/material';

// Dummy data of users who teach skills
const dummyTeachers = {
  Docker: [
    { id: 1, name: 'Alice', rating: 4.5 },
    { id: 2, name: 'Bob', rating: 3.8 },
  ],
  Go: [
    { id: 3, name: 'Charlie', rating: 4.2 },
  ],
  'Cloud DevOps': [
    { id: 4, name: 'Dave', rating: 4.9 },
    { id: 5, name: 'Eve', rating: 4.0 },
  ],
};

const FindTeachers = () => {
  const { skillName } = useParams();
  const [loading, setLoading] = useState(true);
  const teachers = dummyTeachers[skillName] || [];

  useEffect(() => {
    // Simulate API loading delay
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, [skillName]);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          bgcolor: '#121212',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <CircularProgress sx={{ color: '#00FF9F' }} size={60} thickness={5} />
      </Box>
    );
  }

  return (
    <Box p={3} sx={{ minHeight: '100vh', bgcolor: '#121212', color: 'white' }}>
      <Typography variant="h4" color="#00FF9F" mb={3}>
        Teachers for {skillName}
      </Typography>

      {teachers.length === 0 ? (
        <Typography>No teachers found for this skill.</Typography>
      ) : (
        <Box display="flex" flexWrap="wrap" gap={3}>
          {teachers.map((teacher) => (
            <Box
              key={teacher.id}
              sx={{
                border: '1px solid #333',
                borderRadius: 3,
                p: 2,
                width: 250,
                bgcolor: '#1e1e1e',
                boxShadow: 2,
              }}
            >
              <Typography variant="h6" mb={1}>
                {teacher.name}
              </Typography>

              <Rating
                value={teacher.rating}
                precision={0.5}
                readOnly
                sx={{
                  color: '#00FF9F',
                  '& .MuiRating-iconEmpty': {
                    color: 'white',
                  },
                }}
              />

              <Box mt={2}>
                <Button
                  variant="outlined"
                  sx={{
                    borderColor: '#00FF9F',
                    color: '#00FF9F',
                    '&:hover': {
                      bgcolor: '#00FF9F',
                      color: 'black',
                    },
                  }}
                  onClick={() => alert(`Starting chat with ${teacher.name}`)}
                >
                  Message
                </Button>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Box>
  );
};

export default FindTeachers;
