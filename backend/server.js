import cors from 'cors';
import dotenv from 'dotenv';
import pgl from './db.js';
import express from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

dotenv.config();

const app = express();
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());

// Use environment variable for API route prefix
const API_PREFIX = process.env.API_PREFIX || '/api';

// Utility: Capitalize first letter of each word
function toTitleCase(str) {
  return str.replace(/\w\S*/g, (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase());
}
// Utility: Capitalize first letter only
function capitalize(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}

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
    // Normalize skills for onboarding (not using add-skill logic)
    skills = (skills || []).map(skill => ({
      ...skill,
      name: toTitleCase(skill.name.trim()),
      type: skill.type.toLowerCase(),
      level: (skill.level || 'intermediate').toLowerCase()
    }));
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

// Profile endpoint: change password
app.post(`${API_PREFIX}/profile/change-password`, async (req, res) => {
  const { userId, oldPassword, newPassword } = req.body;
  try {
    const result = await pgl.query('SELECT password_hash FROM users WHERE id = $1', [userId]);
    if (result.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    // Compare old password with hash
    const valid = await bcrypt.compare(oldPassword, result.rows[0].password_hash);
    if (!valid) {
      return res.status(400).json({ message: 'Old password is incorrect.' });
    }
    // Hash new password
    const newHashed = await bcrypt.hash(newPassword, 11);
    await pgl.query('UPDATE users SET password_hash = $1 WHERE id = $2', [newHashed, userId]);
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
  let { userId, skill, level, type } = req.body;
  skill = toTitleCase(skill.trim());
  level = (level || '').toLowerCase(); // Store in lowercase for DB constraint
  type = (type || '').toLowerCase(); // Accept 'teach' or 'learn'
  if (type !== 'teach' && type !== 'learn') {
    return res.status(400).json({ message: 'Invalid skill type. Must be "teach" or "learn".' });
  }
  try {
    // Try case-insensitive match first
    let skillRes = await pgl.query('SELECT id FROM skills WHERE LOWER(name) = $1', [skill.toLowerCase()]);
    if (skillRes.rows.length === 0) {
      // Fallback: LIKE search for similar skills
      skillRes = await pgl.query('SELECT id, name FROM skills WHERE LOWER(name) LIKE $1', [`%${skill.toLowerCase()}%`]);
      if (skillRes.rows.length === 1) {
        skill = skillRes.rows[0].name; // Use the DB's canonical name
        // continue to add as before
      } else if (skillRes.rows.length > 1) {
        // Return list of possible skills for user to choose
        return res.status(409).json({
          message: 'Multiple similar skills found.',
          choices: skillRes.rows.map(row => row.name)
        });
      } else {
        return res.status(404).json({ message: 'Skill not found.' });
      }
    }
    const skillId = skillRes.rows[0].id;
    const skillLevel = level || 'intermediate';
    await pgl.query(
      'INSERT INTO user_skills (user_id, skill_id, type, level) VALUES ($1, $2, $3, $4) ON CONFLICT (user_id, skill_id, type) DO NOTHING',
      [userId, skillId, type, skillLevel]
    );
    // Return updated skills (with level, grouped by type)
    const teachRes = await pgl.query(
      `SELECT s.name, us.level FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1 AND us.type = 'teach'`,
      [userId]
    );
    const learnRes = await pgl.query(
      `SELECT s.name, us.level FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1 AND us.type = 'learn'`,
      [userId]
    );
    res.json({ teach: teachRes.rows, learn: learnRes.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile endpoint: remove skill
app.post(`${API_PREFIX}/profile/remove-skill`, async (req, res) => {
  let { userId, skill } = req.body;
  skill = toTitleCase(skill.trim());
  try {
    // Find skill id
    const skillRes = await pgl.query('SELECT id FROM skills WHERE name = $1', [skill]);
    if (skillRes.rows.length === 0) return res.status(404).json({ message: 'Skill not found.' });
    const skillId = skillRes.rows[0].id;
    await pgl.query('DELETE FROM user_skills WHERE user_id = $1 AND skill_id = $2', [userId, skillId]);
    // Return updated skills
    const skillsRes = await pgl.query('SELECT s.name, us.level FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId]);
    res.json({ skills: skillsRes.rows.map(r => ({ name: r.name, level: r.level })) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all matches for a user
app.get(`${API_PREFIX}/matches`, async (req, res) => {
  const { userId } = req.query;
  try {
    const result = await pgl.query(`
      SELECT m.id,
             CASE WHEN m.user1_id = $1 THEN u2.name ELSE u1.name END as other_user_name,
             m.match_score, m.feedback_user1, m.feedback_user2,
             COUNT(msg.id) as message_count
      FROM matches m
      JOIN users u1 ON m.user1_id = u1.id
      JOIN users u2 ON m.user2_id = u2.id
      LEFT JOIN messages msg ON msg.match_id = m.id
      WHERE m.user1_id = $1 OR m.user2_id = $1
      GROUP BY m.id, u1.name, u2.name, m.match_score, m.feedback_user1, m.feedback_user2, m.user1_id, m.user2_id
    `, [userId]);
    res.json(result.rows.map(row => {
      let status = 'pending';
      if (parseInt(row.message_count, 10) > 0) {
        status = 'chatted';
      } else if (!row.match_score || Number(row.match_score) === 0) {
        status = 'ignored';
      }
      return {
        id: row.id,
        name: row.other_user_name,
        status,
        match_score: row.match_score,
        feedback_user1: row.feedback_user1,
        feedback_user2: row.feedback_user2
      };
    }));
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Create or get a match between two users
app.post(`${API_PREFIX}/matches`, async (req, res) => {
  let { user1Id, user2Id, skill } = req.body;
  if (skill) skill = toTitleCase(skill.trim());
  if (!user1Id || !user2Id) {
    return res.status(400).json({ message: 'user1Id and user2Id are required.' });
  }
  try {
    // Check if a match already exists (regardless of order)
    let query = 'SELECT id FROM matches WHERE (user1_id = $1 AND user2_id = $2) OR (user1_id = $2 AND user2_id = $1)';
    let params = [user1Id, user2Id];
    let result = await pgl.query(query, params);
    if (result.rows.length > 0) {
      return res.json({ matchId: result.rows[0].id, created: false });
    }
    // Optionally associate with a skill if provided
    let skillId = null;
    if (skill) {
      const skillRes = await pgl.query('SELECT id FROM skills WHERE name = $1', [skill]);
      if (skillRes.rows.length > 0) {
        skillId = skillRes.rows[0].id;
      }
    }
    // Create the match
    const newMatch = await pgl.query(
      'INSERT INTO matches (user1_id, user2_id, status, match_score) VALUES ($1, $2, $3, $4) RETURNING id',
      [user1Id, user2Id, 'pending', skillId ? 0 : null]
    );
    const matchId = newMatch.rows[0].id;
    // If a skill was involved, create a neutral initial feedback
    if (skillId) {
      await pgl.query(
        'INSERT INTO match_feedback (match_id, user_id, skill_id, score, comment) VALUES ($1, $2, $3, $4, $5)',
        [matchId, user1Id, skillId, 0, '']
      );
      await pgl.query(
        'INSERT INTO match_feedback (match_id, user_id, skill_id, score, comment) VALUES ($1, $2, $3, $4, $5)',
        [matchId, user2Id, skillId, 0, '']
      );
    }
    res.status(201).json({ matchId, created: true });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Submit feedback for a match
app.post(`${API_PREFIX}/matches/feedback`, async (req, res) => {
  const { matchId, userId, skillId, score, comment } = req.body;
  try {
    // Check if the match exists and the user is part of it
    const match = await pgl.query('SELECT id, user1_id, user2_id FROM matches WHERE id = $1', [matchId]);
    if (match.rows.length === 0) return res.status(404).json({ message: 'Match not found.' });
    const { user1_id, user2_id } = match.rows[0];
    if (userId !== user1_id && userId !== user2_id) {
      return res.status(403).json({ message: 'You are not authorized to provide feedback for this match.' });
    }
    // Check if feedback already exists
    const existingFeedback = await pgl.query('SELECT id FROM match_feedback WHERE match_id = $1 AND user_id = $2', [matchId, userId]);
    if (existingFeedback.rows.length > 0) {
      return res.status(409).json({ message: 'Feedback already submitted.' });
    }
    // Insert the feedback
    await pgl.query(
      'INSERT INTO match_feedback (match_id, user_id, skill_id, score, comment) VALUES ($1, $2, $3, $4, $5)',
      [matchId, userId, skillId, score, comment]
    );
    // Update the match score based on feedback (simple average for now)
    const matchFeedback = await pgl.query('SELECT AVG(score) as average_score FROM match_feedback WHERE match_id = $1', [matchId]);
    const averageScore = matchFeedback.rows[0].average_score;
    await pgl.query('UPDATE matches SET match_score = $1 WHERE id = $2', [averageScore, matchId]);
    res.json({ message: 'Feedback submitted successfully.' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all messages for a match (chat)
app.get(`${API_PREFIX}/messages/:matchId`, async (req, res) => {
  const { matchId } = req.params;
  try {
    const result = await pgl.query(
      `SELECT id, sender_id, receiver_id, content, timestamp, delivered_at, read_at
       FROM messages
       WHERE match_id = $1
       ORDER BY timestamp ASC`,
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

// Get all skills (with category) - now /api/all-skills, no LIKE
app.get(`${API_PREFIX}/all-skills`, async (req, res) => {
  try {
    const result = await pgl.query('SELECT id, name, category FROM skills ORDER BY category, name');
    return res.json(result.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Profile skills endpoint: returns skills grouped by type for the user
app.get(`${API_PREFIX}/skills`, async (req, res) => {
  const { userId } = req.query;
  if (!userId) return res.status(400).json({ message: 'userId required' });
  try {
    // Get teach skills
    const teachRes = await pgl.query(
      `SELECT s.name, us.level
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = $1 AND us.type = 'teach'
       ORDER BY s.name`,
      [userId]
    );
    // Get learn skills
    const learnRes = await pgl.query(
      `SELECT s.name, us.level
       FROM user_skills us
       JOIN skills s ON us.skill_id = s.id
       WHERE us.user_id = $1 AND us.type = 'learn'
       ORDER BY s.name`,
      [userId]
    );
    res.json({ teach: teachRes.rows, learn: learnRes.rows });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Public profile endpoint: get user info, bio, and skills by user id
app.get(`${API_PREFIX}/profile/:id`, async (req, res) => {
  const userId = req.params.id;
  try {
    const userRes = await pgl.query('SELECT id, name, email, bio FROM users WHERE id = $1', [userId]);
    if (userRes.rows.length === 0) return res.status(404).json({ message: 'User not found.' });
    // Get skills with level
    const skillsRes = await pgl.query('SELECT s.name, us.level FROM user_skills us JOIN skills s ON us.skill_id = s.id WHERE us.user_id = $1', [userId]);
    res.json({
      id: userRes.rows[0].id,
      username: userRes.rows[0].name,
      bio: userRes.rows[0].bio,
      skills: skillsRes.rows.map(r => ({ name: r.name, level: r.level }))
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// Get all teachers for a given skill
app.get(`${API_PREFIX}/teachers`, async (req, res) => {
  const { skill } = req.query;
  if (!skill) return res.status(400).json({ message: 'Skill is required.' });
  try {
    // Find skill id (case-insensitive)
    const skillRes = await pgl.query('SELECT id FROM skills WHERE LOWER(name) = $1', [skill.toLowerCase()]);
    if (skillRes.rows.length === 0) return res.json([]);
    const skillId = skillRes.rows[0].id;
    // Get users who can teach this skill
    const teachersRes = await pgl.query(`
      SELECT u.id, u.name,
        COALESCE(AVG(mf.score), 0) as rating
      FROM user_skills us
      JOIN users u ON us.user_id = u.id
      LEFT JOIN match_feedback mf ON mf.user_id = u.id AND mf.skill_id = $1
      WHERE us.skill_id = $1 AND us.type = 'teach'
      GROUP BY u.id, u.name
      ORDER BY rating DESC, u.name
    `, [skillId]);
    res.json(teachersRes.rows);
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

app.listen(4000, () => {
  console.log('Server running on port 4000');
});
