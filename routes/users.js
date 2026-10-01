// language: JavaScript, file: routes/users.js
import { Router } from 'express';
import { db } from '../db.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

const r = Router();
const SECRET = process.env.JWT_SECRET || 'change-me';

r.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password || password.length < 8)
    return res.status(400).json({ error: 'bad input' });
  const hash = await bcrypt.hash(password, 12);
  try {
    const info = db.prepare(
      'INSERT INTO users (username, email, pass_hash) VALUES (?,?,?)'
    ).run(username, email, hash);
    const token = jwt.sign({ id: info.lastInsertRowid, username }, SECRET, { expiresIn: '7d' });
    res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
    res.json({ ok: true });
  } catch (e) {
    res.status(409).json({ error: 'username or email taken' });
  }
});

r.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const u = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!u) return res.status(401).json({ error: 'bad creds' });
  const ok = await bcrypt.compare(password, u.pass_hash);
  if (!ok) return res.status(401).json({ error: 'bad creds' });
  const token = jwt.sign({ id: u.id, username: u.username }, SECRET, { expiresIn: '7d' });
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax' });
  res.json({ ok: true });
});

r.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ ok: true });
});

r.get('/me', (req, res) => {
  const t = req.cookies.token;
  if (!t) return res.status(401).json({ error: 'anon' });
  try {
    const u = jwt.verify(t, SECRET);
    const row = db.prepare(
      'SELECT id, username, email, balance_cents, rating, sales FROM users WHERE id = ?'
    ).get(u.id);
    res.json(row);
  } catch { res.status(401).json({ error: 'bad token' }); }
});

export default r;
