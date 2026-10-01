// language: JavaScript, file: seed.js, runtime: Node 20 ESM
import { db } from './db.js';
import bcrypt from 'bcrypt';

const pass = await bcrypt.hash('password123', 12);
const sellers = ['skinlord', 'conqueror_king', 'm416_god', 'cheapaccs'];
for (const s of sellers) {
  db.prepare(`INSERT OR IGNORE INTO users (username, email, pass_hash, rating, sales)
              VALUES (?,?,?,?,?)`).run(
    s, s + '@market.local', pass,
    4.5 + Math.random(), 10 + (Math.random() * 90 | 0));
}

const sids = db.prepare('SELECT id FROM users').all().map(r => r.id);
const sample = [
  ['Conqueror M416 Glacier + 12 mythic', 'EU', 'steam', 'conqueror', 78, 142, 12, 3.4, 34900],
  ['Ace account, season 12 rewards', 'CIS', 'steam', 'ace', 62, 74, 5, 2.8, 12900],
  ['Mobile starter, low K/D, cheap', 'AS', 'mobile', 'gold', 34, 18, 0, 1.2, 2400],
  ['Diamond with mythic AKM', 'NA', 'xbox', 'diamond', 55, 61, 3, 2.1, 18900],
  ['Fresh smurf, 0 bans', 'EU', 'steam', 'silver', 22, 6, 0, 1.5, 1500]
];

for (const [title, region, platform, rank, level, skins, mythic, kd, cents] of sample) {
  const sid = sids[Math.random() * sids.length | 0];
  db.prepare(`INSERT INTO listings
    (seller_id, title, region, platform, rank_tier, level, skins_count, mythic_items, kd, price_cents, description)
    VALUES (?,?,?,?,?,?,?,?,?,?,?)`).run(
    sid, title, region, platform, rank, level, skins, mythic, kd, cents,
    'Автовыдача после оплаты. Гарантия 24 часа.');
}
console.log('seeded');
