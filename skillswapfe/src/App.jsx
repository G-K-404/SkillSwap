import React, { useState } from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { Box } from '@mui/material';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import MatchHistory from './pages/MatchHistory';
import Profile from './pages/Profile';
import FindTeachers from './pages/FindTeachers';
import Messages from './pages/Messages';
import AuthForm from './components/AuthForm';
import OnboardingFlow from './components/OnboardingFlow';

function App() {
  // Simulate auth state (replace with real auth logic)
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  return (
    <Router>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          height: '100vh',
          width: '100vw',
          overflow: 'hidden',
        }}
      >
        <Navbar isLoggedIn={isLoggedIn} setIsLoggedIn={setIsLoggedIn} />
        <Box sx={{ flex: 1, overflow: 'hidden' }}>
          <Routes>
            {!isLoggedIn ? (
              <>
                <Route path="/*" element={<AuthForm setIsLoggedIn={setIsLoggedIn} />} />
                <Route path="/onboarding" element={<OnboardingFlow setIsLoggedIn={setIsLoggedIn} />} />
              </>
            ) : (
              <>
                <Route path="/" element={<Home />} />
                <Route path="/matches" element={<MatchHistory />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/messages" element={<Messages />} />
                <Route path="/find-teachers/:skillName" element={<FindTeachers />} />
              </>
            )}
          </Routes>
        </Box>
      </Box>
    </Router>
  );
}

export default App;
