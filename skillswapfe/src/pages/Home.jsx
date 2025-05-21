import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import SkillAccordion from '../components/SkillAccordion';
import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';
import Cookies from 'js-cookie';
import * as jose from 'jose';
import Typography from '@mui/material/Typography';

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [teachSkills, setTeachSkills] = useState([]);
  const [learnSkills, setLearnSkills] = useState([]);
  let userName = '';

  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const timer = setTimeout(() => setLoading(false), 1000);
    const token = Cookies.get('token');
    let userId;
    if (token) {
      try {
        const payload = jose.decodeJwt(token);
        userId = payload.user.id;
        userName = payload.user.name || 'User';
      } catch (e) {
        setLoading(false);
        return;
      }
      fetch(`http://localhost:4000/api/skills/teach?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setTeachSkills);
      fetch(`http://localhost:4000/api/skills/learn?userId=${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
        .then(res => res.json())
        .then(setLearnSkills);
    }
    return () => {
      clearTimeout(timer);
      document.body.style.overflow = 'auto';
    };
  }, []);

  // Defensive: handle empty/null learnSkills
  const learnSkillLinks = Array.isArray(learnSkills) && learnSkills.length > 0
    ? learnSkills.map(skill => (
        <Link
          key={typeof skill === 'string' ? skill : skill.name}
          to={`/find-teachers/${encodeURIComponent(typeof skill === 'string' ? skill : skill.name)}`}
          style={{ color: '#00FF9F', textDecoration: 'none', display: 'block', marginBottom: 5 }}
        >
          {typeof skill === 'string' ? skill : skill.name}
        </Link>
      ))
    : <Typography sx={{ color: '#888', mb: 2 }}>No skills to learn yet.</Typography>;

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

  // Get name from token for greeting
  let name = '';
  try {
    const token = Cookies.get('token');
    if (token) {
      const payload = jose.decodeJwt(token);
      name = payload.user.name || payload.user.username || 'User';
    }
  } catch {}

  return (
    <div style={{ padding: '20px', minHeight: '100vh', color: 'white', scrollBehavior: 'unset' }}>
      <h1 style={{ color: '#00FFF0', marginTop: 0, marginBottom: 24, fontWeight:"normal" }}>Hey! {name}</h1>
      <SkillAccordion title="Skills I Can Teach" items={teachSkills} />
      <SkillAccordion title="Skills I Want to Learn" items={learnSkillLinks} />
    </div>
  );
};

export default Home;
