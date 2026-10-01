// language: JavaScript, file: routes/accounts.js
import { Router } from 'express';
import { db } from '../db.js';
import jwt from 'jsonwebtoken';

const r = Router();
const SECRET = process.env.JWT_SECRET || 'change-me';

function auth(req, res, next) {
  const t = req.cookies.token;
  if (!t) return res.status(401).json({ error: 'no token' });
  try { req.user = jwt.verify(t, SECRET); next(); }
  catch { res.status(401).json({ error: 'bad token' }); }
}

r.get('/', (req, res) => {
  const { region, platform, rank, min, max, sort } = req.query;
  let q = `SELECT l.*, u.username AS seller, u.rating AS seller_rating, u.sales AS seller_sales
           FROM listings l JOIN users u ON u.id = l.seller_id
           WHERE l.status = 'active'`;
  const p = [];
  if (region)   { q += ' AND l.region = ?';   p.push(region); }
  if (platform) { q += ' AND l.platform = ?'; p.push(platform); }
  if (rank)     { q += ' AND l.rank_tier = ?';p.push(rank); }
  if (min)      { q += ' AND l.price_cents >= ?'; p.push(+min); }
  if (max)      { q += ' AND l.price_cents <= ?'; p.push(+max); }

  const order = {
    price_asc:  'l.price_cents ASC',
    price_desc: 'l.price_cents DESC',
    newest:     'l.created_at DESC',
    rating:     'u.rating DESC'
  }[sort] || 'l.created_at DESC';
  q += ' ORDER BY ' + order + ' LIMIT 100';

  res.json(db.prepare(q).all(...p));
});

r.get('/:id', (req, res) => {
  const l = db.prepare(`
    SELECT l.*, u.username AS seller, u.rating AS seller_rating, u.sales AS seller_sales
    FROM listings l JOIN users u ON u.id = l.seller_id WHERE l.id = ?`).get(req.params.id);
  if (!l) return res.status(404).json({ error: 'not found' });
  res.json(l);
});

r.post('/', auth, (req, res) => {
  const { title, region, platform, rank_tier, level, skins_count,
          mythic_items, kd, price_cents, description, screenshots } = req.body;

  if (!title || !region || !platform || !rank_tier || !price_cents)
    return res.status(400).json({ error: 'missing fields' });

  const info = db.prepare(`
    INSERT INTO listings
    (seller_id, title, region, platform, rank_tier, level, skins_count,
     mythic_items, kd, price_cents, description, screenshots)
    VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`).run(
      req.user.id, title, region, platform, rank_tier,
      level | 0, skins_count | 0, mythic_items | 0, kd || 0,
      price_cents, description || '',
      JSON.stringify(screenshots || []));

  res.json({ id: info.lastInsertRowid });
});

export default r;
