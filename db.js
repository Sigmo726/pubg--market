// language: JavaScript, file: db.js, runtime: Node 20 ESM
import Database from 'better-sqlite3';

export const db = new Database('data.db');
db.pragma('journal_mode = WAL');

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  pass_hash TEXT NOT NULL,
  balance_cents INTEGER DEFAULT 0,
  rating REAL DEFAULT 0,
  sales INTEGER DEFAULT 0,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS listings (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seller_id INTEGER NOT NULL REFERENCES users(id),
  title TEXT NOT NULL,
  region TEXT NOT NULL,
  platform TEXT NOT NULL,
  rank_tier TEXT NOT NULL,
  level INTEGER NOT NULL,
  skins_count INTEGER DEFAULT 0,
  mythic_items INTEGER DEFAULT 0,
  kd REAL DEFAULT 0,
  price_cents INTEGER NOT NULL,
  description TEXT,
  screenshots TEXT,
  status TEXT DEFAULT 'active',
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS orders (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  listing_id INTEGER NOT NULL REFERENCES listings(id),
  buyer_id INTEGER NOT NULL REFERENCES users(id),
  seller_id INTEGER NOT NULL REFERENCES users(id),
  amount_cents INTEGER NOT NULL,
  fee_cents INTEGER NOT NULL,
  status TEXT DEFAULT 'escrow',
  created_at INTEGER DEFAULT (unixepoch()),
  released_at INTEGER
);

CREATE TABLE IF NOT EXISTS reviews (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  order_id INTEGER NOT NULL REFERENCES orders(id),
  seller_id INTEGER NOT NULL,
  buyer_id INTEGER NOT NULL,
  score INTEGER NOT NULL,
  text TEXT,
  created_at INTEGER DEFAULT (unixepoch())
);

CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_region ON listings(region);
`);
