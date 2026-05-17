// routes/commentRoutes.js
// API cho Comments: Tạo, Xóa bình luận

const express = require('express');
const router = express.Router({ mergeParams: true }); // mergeParams để lấy :id từ parent route
const pool = require('../config/db');
const { verifyToken } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// POST /api/questions/:id/comments
// Đăng bình luận — Cần đăng nhập
// ─────────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const questionId = req.params.id;
  const { content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ message: 'Nội dung bình luận không được để trống!' });
  }

  if (content.trim().length < 5) {
    return res.status(400).json({ message: 'Bình luận quá ngắn (tối thiểu 5 ký tự)!' });
  }

  try {
    // Kiểm tra câu hỏi có tồn tại không
    const [questions] = await pool.query('SELECT id FROM questions WHERE id = ?', [questionId]);
    if (questions.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi!' });
    }

    // Thêm bình luận
    const [result] = await pool.query(
      'INSERT INTO comments (question_id, author_id, content) VALUES (?, ?, ?)',
      [questionId, req.user.id, content.trim()]
    );

    // Cập nhật số lượng answers trong bảng questions
    await pool.query(
      'UPDATE questions SET answers = (SELECT COUNT(*) FROM comments WHERE question_id = ?) WHERE id = ?',
      [questionId, questionId]
    );

    // Lấy bình luận vừa tạo kèm thông tin tác giả
    const [newComment] = await pool.query(
      `SELECT c.id, c.content, c.created_at, u.id AS author_id, u.username AS author
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: 'Đăng bình luận thành công!',
      comment: {
        ...newComment[0],
        time: 'Vừa xong',
      }
    });

  } catch (err) {
    console.error('Lỗi POST /questions/:id/comments:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/questions/:id/comments/:commentId
// Xóa bình luận — Cần là chủ bình luận hoặc admin
// ─────────────────────────────────────────────────────────────
router.delete('/:commentId', verifyToken, async (req, res) => {
  const { id: questionId, commentId } = req.params;

  try {
    const [comments] = await pool.query(
      'SELECT id, author_id FROM comments WHERE id = ? AND question_id = ?',
      [commentId, questionId]
    );

    if (comments.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy bình luận!' });
    }

    if (comments[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa bình luận này!' });
    }

    await pool.query('DELETE FROM comments WHERE id = ?', [commentId]);

    // Cập nhật lại số answers
    await pool.query(
      'UPDATE questions SET answers = (SELECT COUNT(*) FROM comments WHERE question_id = ?) WHERE id = ?',
      [questionId, questionId]
    );

    res.json({ message: 'Xóa bình luận thành công!' });

  } catch (err) {
    console.error('Lỗi DELETE /comments/:commentId:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

module.exports = router;
