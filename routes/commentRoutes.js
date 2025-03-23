const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

router.post('/', auth, (req, res) => {
  const { postId, parentCommentId, content } = req.body;
  db.query(
    'INSERT INTO comments (user_id, post_id, parent_comment_id, content) VALUES (?, ?, ?, ?)',
    [req.user.id, postId, parentCommentId || null, content],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: 'Comment created', commentId: result.insertId });
    }
  );
});

router.get('/post/:postId', (req, res) => {
  const { postId } = req.params;
  db.query(
    'SELECT comments.*, users.username FROM comments JOIN users ON comments.user_id = users.id WHERE comments.post_id = ? ORDER BY created_at ASC',
    [postId],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    }
  );
});

router.delete('/:id', auth, (req, res) => {
  const { id } = req.params;
  db.query(
    'SELECT comments.user_id AS comment_user_id, posts.user_id AS post_user_id ' +
    'FROM comments ' +
    'JOIN posts ON comments.post_id = posts.id ' +
    'WHERE comments.id = ?',
    [id],
    (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      if (results.length === 0) return res.status(404).json({ message: 'Comment not found' });
      const { comment_user_id, post_user_id } = results[0];
      if (req.user.id !== comment_user_id && req.user.id !== post_user_id) {
        return res.status(403).json({ message: 'You are not authorized to delete this comment' });
      }
      db.query('DELETE FROM comments WHERE id = ?', [id], (err) => {
        if (err) return res.status(500).json({ error: err.message });
        res.status(200).json({ message: 'Comment deleted' });
      });
    }
  );
});

module.exports = router;