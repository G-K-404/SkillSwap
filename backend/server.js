import cors from 'cors';
import dotenv from 'dotenv';
import pgl from './db.js';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

console.log(bcrypt);
dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Use environment variable for API route prefix
const API_PREFIX = process.env.API_PREFIX || '/api';

app.post(`${API_PREFIX}/auth/login`, async (req, res) => {
  const { email, password } = req.body;

  try {
    const result = await pgl.query('SELECT id, name, email, password_hash FROM users WHERE email = $1', [email]);
    if (result.rows.length === 0) {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    // Use password_hash, not password
    let valid = await bcrypt.compare(password, result.rows[0].password_hash);
    if (valid) {
      const user = {
        id: result.rows[0].id,
        name: result.rows[0].name,
        email: result.rows[0].email
      };
      const token = jwt.sign({ user }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
      res.json({ token });
    } else {
      return res.status(401).json({ message: 'Invalid email or password.' });
    }
    
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post(`${API_PREFIX}/auth/signup`, async (req, res) => {
  let { name, email, password, bio, skills } = req.body;
  // Fix: ensure password is not undefined and hash it
  if (!password) {
    return res.status(400).json({ message: 'Password is required.' });
  }
  const hashedPassword = await bcrypt.hash(password, 11);
  const client = await pgl.connect();
  try {
    const exists = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      client.release();
      return res.status(409).json({ message: 'Email already registered.' });
    }
    const userRes = await client.query(
      'INSERT INTO users (name, email, password_hash, bio) VALUES ($1, $2, $3, $4) RETURNING id, name, email, bio',
      [name, email, hashedPassword, bio]
    );
    const user = { id: userRes.rows[0].id, name: userRes.rows[0].name, email: userRes.rows[0].email };
    const userId = user.id;
    for (const skill of skills) {
      const skillRes = await client.query('SELECT id FROM skills WHERE name = $1', [skill.name]);
      if (skillRes.rows.length === 0) continue;
      const skillId = skillRes.rows[0].id;
      await client.query(
        'INSERT INTO user_skills (user_id, skill_id, type, level) VALUES ($1, $2, $3, $4)',
        [userId, skillId, skill.type, skill.level || 'intermediate']
      );
    }
    client.release();
    // Generate JWT just like login
    const token = jwt.sign({ user }, process.env.JWT_SECRET || 'devsecret', { expiresIn: '7d' });
    res.status(201).json({ token });
  } catch (err) {
    client.release();
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.post('/api/profile/change-password', async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const result = await pgl.query('SELECT password FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    if (result.rows[0].password !== oldPassword) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }
    await pgl.query('UPDATE users SET password = $1 WHERE id = $2', [newPassword, userId]);
    return res.json({ message: 'Password changed successfully!' });
  } catch (err) {
    return res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile endpoint: get user info and bio
app.get(`${API_PREFIX}/profile`, async (req, res) => {
  const { userId } = req.query;
  try {
    const userRes = await pgl.query('SELECT id, name, email, bio FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    // Get skills
    const skillsRes = await pgl.query('SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId]);
    res.json({ user: userRes.rows[0], skills: skillsRes.rows.map(r => r.name) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile endpoint: update bio
app.post(`${API_PREFIX}/profile/update-bio`, async (req, res) => {
  const { userId, bio } = req.body;
  try {
    await pgl.query('UPDATE users SET bio = $1 WHERE id = $2', [bio, userId]);
    res.json({ bio });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile endpoint: add skill
app.post(`${API_PREFIX}/profile/add-skill`, async (req, res) => {
  const { userId, skill } = req.body;
  try {
    // Find skill id
    const skillRes = await pgl.query('SELECT id FROM skills WHERE name = $1', [skill]);
    if (skillRes.rows.length === 0) return res.status(404).json({ message: 'Skill not found.' });
    const skillId = skillRes.rows[0].id;
    // Insert if not already present
    await pgl.query('INSERT INTO user_skills (user_id, skill_id, type) VALUES ($1, $2, $3) ON CONFLICT DO NOTHING', [userId, skillId, 'teach']);
    // Return updated skills
    const skillsRes = await pgl.query('SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId]);
    res.json({ skills: skillsRes.rows.map(r => r.name) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile endpoint: remove skill
app.post(`${API_PREFIX}/profile/remove-skill`, async (req, res) => {
  const { userId, skill } = req.body;
  try {
    // Find skill id
    const skillRes = await pgl.query('SELECT id FROM skills WHERE name = $1', [skill]);
    if (skillRes.rows.length === 0) return res.status(404).json({ message: 'Skill not found.' });
    const skillId = skillRes.rows[0].id;
    await pgl.query('DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2', [userId, skillId]);
    // Return updated skills
    const skillsRes = await pgl.query('SELECT s.name FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId]);
    res.json({ skills: skillsRes.rows.map(r => r.name) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.get('/api/matches', async (req, res) => {
  const { userId } = req.query;
  console.log(userId);
  try {
    const result = await pgl.query(`
      SELECT m.id, 
             CASE WHEN m.user1_id = $1 THEN u2.name ELSE u1.name END as other_user_username,
             m.status, m.match_score, m.feedback_user1, m.feedback_user2
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      WHERE m.user1_id = $1 OR m.user2_id = $1
    `, [userId]);
    console.log(result.rows.map(row => ({
      id: row.id,
      username: row.other_user_username,
      status: row.status,
      match_score: row.match_score,
      feedback_user1: row.feedback_user1,
      feedback_user2: row.feedback_user2
    })));
    res.json(result.rows.map(row => ({
      id: row.id,
      username: row.other_user_username,
      status: row.status,
      match_score: row.match_score,
      feedback_user1: row.feedback_user1,
      feedback_user2: row.feedback_user2
    })));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all skills (with category)
app.get(`${API_PREFIX}/skills`, async (req, res) => {
  try {
    const result = await pgl.query('SELECT id, name, category FROM skills ORDER BY category, name');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user's skills to teach
app.get(`${API_PREFIX}/skills/teach`, async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pgl.query(
      `SELECT s.name, us.level FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1 AND us.type = 'teach'`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get user's skills to learn
app.get(`${API_PREFIX}/skills/learn`, async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pgl.query(
      `SELECT s.name, us.level FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1 AND us.type = 'learn'`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get teachers for a skill
app.get(`${API_PREFIX}/teachers`, async (req, res) => {
  const { skill } = req.query;
  try {
    const result = await pgl.query(
      `SELECT u.id, u.name, u.bio FROM users u
       JOIN user_skills us ON u.id = us.user_id
       JOIN skills s ON us.skill_id = s.id
       WHERE s.name = $1 AND us.type = 'teach'`,
      [skill]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get messages for a match (chat)
app.get(`${API_PREFIX}/messages/:matchId`, async (req, res) => {
  const { matchId } = req.params;
  try {
    const result = await pgl.query(
      `SELECT m.id, m.sender_id, m.receiver_id, m.content, m.timestamp, u1.name as sender_name, u2.name as receiver_name
       FROM messages m
       JOIN users u1 ON m.sender_id = u1.id
       JOIN users u2 ON m.receiver_id = u2.id
       WHERE m.match_id = $1
       ORDER BY m.timestamp ASC`,
      [matchId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Send a message in a match (chat)
app.post(`${API_PREFIX}/messages/:matchId`, async (req, res) => {
  const { matchId } = req.params;
  const { senderId, receiverId, content } = req.body;
  try {
    const result = await pgl.query(
      `INSERT INTO messages (match_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [matchId, senderId, receiverId, content]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
