import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Chip, TextField, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import Cookies from 'js-cookie';
import * as jose from 'jose';

const Profile = () => {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [bio, setBio] = useState('');
  const [bioDraft, setBioDraft] = useState('');
  const [editingBio, setEditingBio] = useState(false);
  const [skills, setSkills] = useState([]);
  const [allSkills, setAllSkills] = useState([]);
  const [newSkill, setNewSkill] = useState('');
  const [error, setError] = useState('');
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // status: idle, loading, success, error
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const token = Cookies.get('token');
    if (!token) {
      setLoading(false);
      return;
    }
    let userId;
    try {
      const payload = jose.decodeJwt(token);
      console.log(payload);
      userId = payload.user.id;
      if (!userId) throw new Error('No userId in token');
    } catch (e) {
      setLoading(false);
      return;
    }
    // Fetch user profile
    fetch(`http://localhost:4000/api/profile?userId=${userId}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
      .then(res => res.json())
      .then(data => {
        setUser(data.user);
        setBio(data.user.bio || '');
        setSkills(data.skills || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
    // Fetch all skills for add/remove
    fetch('http://localhost:4000/api/skills')
      .then(res => res.json())
      .then(setAllSkills);
  }, []);

  const handleAddSkill = () => {
    if (!newSkill) return;
    fetch('http://localhost:4000/api/profile/add-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Cookies.get('token')}` },
      body: JSON.stringify({ skill: newSkill, userId: user.id })
    })
      .then(res => res.json())
      .then(data => {
        setSkills(data.skills);
        setNewSkill('');
      });
  };

  const handleRemoveSkill = (skill) => {
    fetch('http://localhost:4000/api/profile/remove-skill', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Cookies.get('token')}` },
      body: JSON.stringify({ skill, userId: user.id })
    })
      .then(res => res.json())
      .then(data => setSkills(data.skills));
  };

  const handleChangePassword = () => {
    setStatus('loading');
    setMessage('');

    // Simulate async backend call
    setTimeout(() => {
      // Simulate success or error randomly (replace with real API)
      const isSuccess = Math.random() > 0.3;

      if (isSuccess) {
        setStatus('success');
        setMessage('Password changed successfully!');
        // Reset form inputs after success
        setOldPassword('');
        setNewPassword('');
      } else {
        setStatus('error');
        setMessage('Error: Old password is incorrect.');
      }
    }, 1500);
  };

  const handleSaveBio = () => {
    setError('');
    fetch('http://localhost:4000/api/profile/update-bio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${Cookies.get('token')}` },
      body: JSON.stringify({ userId: user.id, bio: bioDraft })
    })
      .then(res => res.json())
      .then(data => {
        setBio(data.bio);
        setEditingBio(false);
      })
      .catch(() => setError('Failed to update bio.'));
  };

  const handleClose = () => {
    setOpen(false);
    setTimeout(()=>{setStatus('idle');
    setMessage('');
    setOldPassword('');
    setNewPassword('');},150)
  };

  if (loading) {
    return <Box sx={{ color: '#00FF9F', display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}><CircularProgress sx={{ color: '#00FF9F' }} /></Box>;
  }

  return (
    <Box sx={{ color: 'white', backgroundColor: '#121212', p: 3, minHeight: '100vh' }}>
      <Paper elevation={6} sx={{ p: 4, bgcolor: '#181F1F', borderRadius: 3, mb: 3 }}>
        <Typography variant="h4" sx={{ color: '#00FFF0', fontWeight: 700, mb: 2 }}>Profile</Typography>
        <Typography variant="h6" sx={{ color: '#00FFF0', mb: 1 }}>Bio</Typography>
        {editingBio ? (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2, maxWidth: 600 }}>
            <TextField
              value={bioDraft}
              onChange={e => setBioDraft(e.target.value)}
              multiline
              minRows={2}
              maxRows={6}
              fullWidth
              sx={{ input: { color: '#00FFF0' }, label: { color: '#00FFF0' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00FFF0' }, '&:hover fieldset': { borderColor: '#00FF9F' } }, fontSize: 18 }}
            />
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              <Button variant="contained" sx={{ bgcolor: '#00FFF0', color: '#121212', fontWeight: 700, minWidth: 100 }} onClick={handleSaveBio}>Save</Button>
              <Button variant="outlined" sx={{ color: '#00FFF0', borderColor: '#00FFF0', minWidth: 100 }} onClick={() => { setEditingBio(false); setBioDraft(bio); }}>Cancel</Button>
            </Box>
          </Box>
        ) : (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Typography sx={{ color: '#00FFF0', fontWeight: 600, fontSize: 18, mr: 2 }}>
              {bio || 'No bio set.'}
            </Typography>
            <Button variant="text" sx={{ color: '#00FFF0', fontWeight: 700 }} onClick={() => { setEditingBio(true); setBioDraft(bio); }}>Edit</Button>
          </Box>
        )}
        <Typography variant="h6" sx={{ color: '#00FFF0', mb: 1 }}>Skills</Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2 }}>
          {skills.map(skill => (
            <Chip key={skill} label={skill} onDelete={() => handleRemoveSkill(skill)} sx={{ bgcolor: '#00FFF0', color: '#121212', fontWeight: 700, fontSize: 16 }} />
          ))}
        </Box>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', mb: 2 }}>
          <TextField
            label="Add Skill"
            value={newSkill}
            onChange={e => setNewSkill(e.target.value)}
            select={false}
            sx={{ input: { color: '#00FFF0' }, label: { color: '#00FFF0' }, '& .MuiOutlinedInput-root': { '& fieldset': { borderColor: '#00FFF0' }, '&:hover fieldset': { borderColor: '#00FF9F' } } }}
            fullWidth
          />
          <Button variant="contained" sx={{ bgcolor: '#00FFF0', color: '#121212', fontWeight: 700 }} onClick={handleAddSkill}>Add</Button>
        </Box>
        {error && <Typography color="#FF4D4D">{error}</Typography>}
      </Paper>

      <Button
        variant="contained"
        sx={{ bgcolor: '#00FF9F', color: 'black', '&:hover': { bgcolor: '#00e68a' } }}
        onClick={() => setOpen(true)}
      >
        Change Password
      </Button>

      <Dialog
        open={open}
        onClose={() => status !== 'loading' && handleClose()}
        PaperProps={{
          sx: {
            bgcolor: '#2c2c2c',
            color: 'white',
            borderRadius: 2,
            minWidth: 400,
          }
        }}
      >
        <DialogTitle sx={{ color: '#00FF9F' }}>Change Password</DialogTitle>

        <DialogContent>
          {status === 'loading' ? (
            <Box
              sx={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: 150,
              }}
            >
              <CircularProgress sx={{ color: '#00FF9F' }} size={60} thickness={5} />
            </Box>
          ) : (
            <>
              <TextField
                margin="dense"
                label="Old Password"
                type="password"
                fullWidth
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                sx={{
                  input: { color: 'white' },
                  label: { color: 'wheat' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'gray' },
                    '&:hover fieldset': { borderColor: '#00FF9F' },
                  }
                }}
              />
              <TextField
                margin="dense"
                label="New Password"
                type="password"
                fullWidth
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                disabled={status === 'loading' || status === 'success'}
                sx={{
                  input: { color: 'white' },
                  label: { color: 'wheat' },
                  '& .MuiOutlinedInput-root': {
                    '& fieldset': { borderColor: 'gray' },
                    '&:hover fieldset': { borderColor: '#00FF9F' },
                  }
                }}
              />

              {message && (
                <Typography
                  mt={2}
                  sx={{
                    color: status === 'success' ? '#00FF9F' : '#FF4D4D',
                    fontWeight: 'bold',
                  }}
                >
                  {message}
                </Typography>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={handleClose}
            sx={{ color: '#ccc' }}
            disabled={status === 'loading'}
          >
            {status === 'success' ? 'Close' : 'Cancel'}
          </Button>

          {status !== 'success' && (
            <Button
              onClick={handleChangePassword}
              variant="contained"
              sx={{ bgcolor: '#00FF9F', color: 'black', '&:hover': { bgcolor: '#00e68a' } }}
              disabled={
                status === 'loading' ||
                !oldPassword ||
                !newPassword
              }
            >
              Save
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Profile;
