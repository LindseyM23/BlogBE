const express = require('express');
const router = express.Router();
const db = require('../db');
const multer = require('multer');
const path = require('path');
const auth = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

router.post('/', auth, upload.single('image'), (req, res) => {
  const { title, content, description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  db.query(
    'INSERT INTO posts (user_id, title, content, description, image) VALUES (?, ?, ?, ?, ?)',
    [req.user.id, title, content, description || content.slice(0, 100), image],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Post created', postId: result.insertId });
    }
  );
});

router.get('/', (req, res) => {
  db.query(
    'SELECT posts.*, users.username, COUNT(likes.id) as like_count ' +
    'FROM posts ' +
    'JOIN users ON posts.user_id = users.id ' +
    'LEFT JOIN likes ON posts.id = likes.post_id ' +
    'GROUP BY posts.id, users.username ' +
    'ORDER BY posts.created_at DESC',
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    }
  );
});

router.put('/:id', auth, upload.single('image'), (req, res) => {
  const { id } = req.params;
  const { title, content, description } = req.body;
  const image = req.file ? `/uploads/${req.file.filename}` : null;
  db.query('SELECT user_id FROM posts WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results[0].user_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    const query = image
      ? 'UPDATE posts SET title = ?, content = ?, description = ?, image = ? WHERE id = ?'
      : 'UPDATE posts SET title = ?, content = ?, description = ? WHERE id = ?';
    const values = image ? [title, content, description || content.slice(0, 100), image, id] : [title, content, description || content.slice(0, 100), id];
    db.query(query, values, (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Post updated' });
    });
  });
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  db.query('SELECT user_id FROM posts WHERE id = ?', [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results[0].user_id !== req.user.id) return res.status(403).json({ message: 'Unauthorized' });
    db.query('DELETE FROM posts WHERE id = ?', [id], (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json({ message: 'Post deleted' });
    });
  });
});

router.post('/:id/like', auth, (req, res) => {
  const { id } = req.params;
  db.query('SELECT * FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length > 0) {
      db.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [req.user.id, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Unliked successfully' });
      });
    } else {
      db.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [req.user.id, id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Liked successfully' });
      });
    }
  });
});

module.exports = router;