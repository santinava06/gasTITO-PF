import db from '../models/user.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'supersecret';

export const register = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (user) return res.status(400).json({ error: 'El usuario ya existe' });
    const hash = await bcrypt.hash(password, 10);
    db.run('INSERT INTO users (email, password) VALUES (?, ?)', [email, hash], function (err) {
      if (err) return res.status(500).json({ error: err.message });
      const token = jwt.sign({ id: this.lastID, email }, JWT_SECRET, { expiresIn: '2h' });
      res.status(201).json({ token, user: { id: this.lastID, email } });
    });
  });
};

export const login = (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email y contraseña son requeridos' });
  }
  db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
    if (!user) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: 'Usuario o contraseña incorrectos' });
    const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ token, user: { id: user.id, email: user.email } });
  });
}; 