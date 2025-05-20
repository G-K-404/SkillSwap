import React from 'react';
import { AppBar, Toolbar, Typography, Button } from '@mui/material';
import { Link } from 'react-router-dom';

const linkButtonStyle = {
  color: 'white',
  textDecoration: 'none',
  '&:hover': {
    backgroundColor: 'transparent',
    color: 'white',
  },
};

const Navbar = () => (
  <AppBar position="static" sx={{bgcolor:"#00FF9F"}}>
    <Toolbar>
      <Typography variant="h6" sx={{ flexGrow: 1,color:"black", fontWeight: 700, cursor:"default" }}>
        SkillSwap
      </Typography>
      <Button component={Link} to="/messages" sx={{color: 'black', fontWeight: 700, px: 2,py: 1,borderRadius: 2,'&:hover': {backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive',}}}>
        Messages
      </Button>
      <Button component={Link} to="/" sx={{color: 'black', fontWeight: 700, px: 2,py: 1,borderRadius: 2,'&:hover': {backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive',}}}>
        Home
      </Button>
      <Button component={Link} to="/matches" sx={{color: 'black', fontWeight: 700, px: 2,py: 1,borderRadius: 2,'&:hover': {backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive',}}}>
        Matches
      </Button>
      <Button component={Link} to="/profile" sx={{color: 'black', fontWeight: 700, px: 2,py: 1,borderRadius: 2,'&:hover': {backgroundColor: 'rgba(65, 65, 65, 0.1)', color: 'olive',}}}>
        Profile
      </Button>
    </Toolbar>
  </AppBar>
);

export default Navbar;
