const express = require('express');
const router = express.Router();
const db = require('../db');
const crypto = require('crypto');

/**
 * @swagger
 * /api/reset/request:
 *   post:
 *     summary: Request a password reset code
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *     responses:
 *       200:
 *         description: Reset code generated (in real app, sent via email)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/request', (req, res) => {
  const { username } = req.body;
  db.query('SELECT id FROM users WHERE username = ?', [username], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ message: 'User not found' });

    const userId = results[0].id;
    const code = crypto.randomBytes(3).toString('hex'); // 6-character code
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes expiry

    db.query(
      'INSERT INTO reset_codes (user_id, code, expires_at) VALUES (?, ?, ?)',
      [userId, code, expiresAt],
      (err) => {
        if (err) return res.status(500).json({ error: err.message });
        // In a real app, send `code` via email. For now, return it for testing.
        res.status(200).json({ message: 'Reset code generated', code });
      }
    );
  });
});

/**
 * @swagger
 * /api/reset/verify:
 *   post:
 *     summary: Verify reset code and update password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               username:
 *                 type: string
 *               code:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Invalid or expired code
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/verify', (req, res) => {
  const { username, code, newPassword } = req.body;
  db.query('SELECT id FROM users WHERE username = ?', [username], (err, userResults) => {
    if (err) return res.status(500).json({ error: err.message });
    if (userResults.length === 0) return res.status(404).json({ message: 'User not found' });

    const userId = userResults[0].id;
    db.query(
      'SELECT * FROM reset_codes WHERE user_id = ? AND code = ? AND expires_at > NOW()',
      [userId, code],
      (err, codeResults) => {
        if (err) return res.status(500).json({ error: err.message });
        if (codeResults.length === 0) return res.status(400).json({ message: 'Invalid or expired code' });

        db.query(
          'UPDATE users SET password = ? WHERE id = ?',
          [newPassword, userId],
          (err) => {
            if (err) return res.status(500).json({ error: err.message });
            db.query('DELETE FROM reset_codes WHERE user_id = ? AND code = ?', [userId, code], (err) => {
              if (err) return res.status(500).json({ error: err.message });
              res.status(200).json({ message: 'Password reset successfully' });
            });
          }
        );
      }
    );
  });
});

module.exports = router;