// language: JavaScript, file: server.js, runtime: Node 20 ESM
import express from 'express';
import cookieParser from 'cookie-parser';
import { fileURLToPath } from 'url';
import path from 'path';
import './db.js';
import accounts from './routes/accounts.js';
import orders from './routes/orders.js';
import users from './routes/users.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/api/accounts', accounts);
app.use('/api/orders', orders);
app.use('/api/users', users);

app.get('/health', (req, res) => res.json({ ok: true }));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log('market up on :' + PORT));
