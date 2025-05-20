import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SkillAccordion from '../components/SkillAccordion';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

const Home = () => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => setLoading(false), 1000);

    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto';
    };
  }, []);

  const teachSkills = ['Python', 'React', 'Machine Learning'];
  const learnSkills = ['Docker', 'Go', 'Cloud DevOps'];

  const learnSkillLinks = learnSkills.map(skill => (
    <Link
      key={skill}
      to={`/find-teachers/${encodeURIComponent(skill)}`}
      style={{ color: '#00FF9F', textDecoration: 'none', display: 'block', marginBottom: 5 }}
    >
      {skill}
    </Link>
  ));

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          backgroundColor: '#1E1E1E',
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
    <div style={{ padding: '20px', minHeight: '100vh', color: 'white', scrollBehavior: 'unset' }}>
      <h2 style={{ color: '#00FF9F' }}>Welcome to SkillSwap</h2>
      <SkillAccordion title="Skills I Can Teach" items={teachSkills} />
      <SkillAccordion title="Skills I Want to Learn" items={learnSkillLinks} />
    </div>
  );
};

export default Home;
