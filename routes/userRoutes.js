const express = require('express');
const router = express.Router();
const db = require('../db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();

const saltRounds = 10;

router.post('/signup', async (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) return res.status(400).json({ message: 'Username already exists' });
    bcrypt.hash(password, saltRounds, (err, hash) => {
      if (err) return res.status(500).json({ error: err.message });
      db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, hash], (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(201).json({ message: 'User created', userId: result.insertId });
      });
    });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });
    const hashedPassword = results[0].password;
    bcrypt.compare(password, hashedPassword, (err, match) => {
      if (err) return res.status(500).json({ error: err.message });
      if (!match) return res.status(401).json({ message: 'Invalid credentials' });
      const secret = process.env.JWT_SECRET || 'fallbacksecret123';
      console.log('Using JWT_SECRET:', secret);
      const token = jwt.sign(
        { id: results[0].id, username: results[0].username },
        secret,
        { expiresIn: '10h' }
      );
      console.log('Generated token:', token);
      res.status(200).json({ token });
    });
  });
});

module.exports = router;