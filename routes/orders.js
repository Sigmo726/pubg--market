// language: JavaScript, file: routes/orders.js
import { Router } from 'express';
import { db } from '../db.js';
import jwt from 'jsonwebtoken';

const r = Router();
const SECRET = process.env.JWT_SECRET || 'change-me';
const FEE_PCT = 0.05;

function auth(req, res, next) {
  const t = req.cookies.token;
  if (!t) return res.status(401).json({ error: 'no token' });
  try { req.user = jwt.verify(t, SECRET); next(); }
  catch { res.status(401).json({ error: 'bad token' }); }
}

r.post('/', auth, (req, res) => {
  const { listing_id } = req.body;
  const l = db.prepare(`SELECT * FROM listings WHERE id = ? AND status = 'active'`).get(listing_id);
  if (!l) return res.status(404).json({ error: 'listing gone' });
  if (l.seller_id === req.user.id) return res.status(400).json({ error: 'own listing' });

  const buyer = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (buyer.balance_cents < l.price_cents)
    return res.status(402).json({ error: 'insufficient balance' });

  const fee = Math.floor(l.price_cents * FEE_PCT);

  const tx = db.transaction(() => {
    db.prepare('UPDATE users SET balance_cents = balance_cents - ? WHERE id = ?')
      .run(l.price_cents, req.user.id);
    db.prepare(`UPDATE listings SET status = 'sold' WHERE id = ?`).run(l.id);
    return db.prepare(`
      INSERT INTO orders (listing_id, buyer_id, seller_id, amount_cents, fee_cents)
      VALUES (?,?,?,?,?)`).run(l.id, req.user.id, l.seller_id, l.price_cents, fee);
  });
  const info = tx();
  res.json({ order_id: info.lastInsertRowid, status: 'escrow' });
});

r.post('/:id/release', auth, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'no order' });
  if (o.buyer_id !== req.user.id) return res.status(403).json({ error: 'not yours' });
  if (o.status !== 'escrow') return res.status(400).json({ error: 'wrong state' });

  const payout = o.amount_cents - o.fee_cents;
  db.transaction(() => {
    db.prepare('UPDATE users SET balance_cents = balance_cents + ? WHERE id = ?')
      .run(payout, o.seller_id);
    db.prepare(`UPDATE orders SET status = 'released', released_at = unixepoch() WHERE id = ?`)
      .run(o.id);
    db.prepare('UPDATE users SET sales = sales + 1 WHERE id = ?').run(o.seller_id);
  })();
  res.json({ ok: true, payout_cents: payout });
});

r.post('/:id/dispute', auth, (req, res) => {
  const o = db.prepare('SELECT * FROM orders WHERE id = ?').get(req.params.id);
  if (!o) return res.status(404).json({ error: 'no order' });
  if (![o.buyer_id, o.seller_id].includes(req.user.id))
    return res.status(403).json({ error: 'not party' });
  db.prepare(`UPDATE orders SET status = 'disputed' WHERE id = ?`).run(o.id);
  res.json({ ok: true });
});

export default r;
