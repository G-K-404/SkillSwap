import React, { useState } from 'react';
import {
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Box,
  CircularProgress,
  Typography
} from '@mui/material';

const Profile = () => {
  const [open, setOpen] = useState(false);
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');

  // status: idle, loading, success, error
  const [status, setStatus] = useState('idle');
  const [message, setMessage] = useState('');

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

  const handleClose = () => {
    setOpen(false);
    setTimeout(()=>{setStatus('idle');
    setMessage('');
    setOldPassword('');
    setNewPassword('');},150)
  };

  return (
    <div style={{ padding: '20px' }}>
      <h1>Hi there! Alice Johnson</h1>
      <h4><b>Email:</b> alice@example.com</h4>
      <h4><b>Bio:</b> Passionate about tech and education.</h4>

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
    </div>
  );
};

export default Profile;
