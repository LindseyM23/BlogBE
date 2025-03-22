const express = require('express');
const router = express.Router();
const db = require('../db'); 

/**
 * @swagger
 * /api/users/signup:
 *   post:
 *     summary: Register a new user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Username already exists
 *       500:
 *         description: Server error
 */
router.post('/signup', (req, res) => {
  const { username, password } = req.body;

  // Check if username exists
  db.query('SELECT * FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) return res.status(400).json({ message: 'Username already exists' });

    // Insert new user
    db.query('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'User created successfully' });
    });
  });
});

/**
 * @swagger
 * /api/users/login:
 *   post:
 *     summary: Log in a user
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', (req, res) => {
  const { username, password } = req.body;

  db.query('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(401).json({ message: 'Invalid credentials' });

    const user = results[0];
    res.status(200).json({ message: 'Login successful', user: { id: user.id, username: user.username } });
  });
});

module.exports = router;