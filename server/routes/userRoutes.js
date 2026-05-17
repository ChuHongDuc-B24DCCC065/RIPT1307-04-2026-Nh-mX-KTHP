// routes/userRoutes.js
// API cho User Profile: Xem thông tin, cập nhật, đổi mật khẩu

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const bcrypt = require('bcrypt');
const { verifyToken } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// GET /api/users/me
// Lấy thông tin user đang đăng nhập
// ─────────────────────────────────────────────────────────────
router.get('/me', verifyToken, async (req, res) => {
  try {
    const [users] = await pool.query(
      'SELECT id, username, email, role, created_at FROM users WHERE id = ?',
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
    }

    res.json({ user: users[0] });

  } catch (err) {
    console.error('Lỗi GET /users/me:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/users/:id
// Xem profile công khai của bất kỳ user nào
// ─────────────────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  const { id } = req.params;

  try {
    const [users] = await pool.query(
      'SELECT id, username, role, created_at FROM users WHERE id = ?',
      [id]
    );

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy người dùng!' });
    }

    // Lấy danh sách câu hỏi của user này
    const [questions] = await pool.query(
      `SELECT id, title, tags, votes, answers, created_at
       FROM questions
       WHERE author_id = ?
       ORDER BY created_at DESC`,
      [id]
    );

    const formatted = questions.map(q => ({
      ...q,
      tags: typeof q.tags === 'string' ? JSON.parse(q.tags) : (q.tags || []),
    }));

    res.json({
      user: users[0],
      questions: formatted,
      stats: {
        totalQuestions: questions.length,
        totalVotes: questions.reduce((sum, q) => sum + (q.votes || 0), 0),
      }
    });

  } catch (err) {
    console.error('Lỗi GET /users/:id:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/users/me
// Cập nhật thông tin cá nhân (username, email)
// ─────────────────────────────────────────────────────────────
router.put('/me', verifyToken, async (req, res) => {
  const { username, email } = req.body;
  const userId = req.user.id;

  if (!username?.trim() || !email?.trim()) {
    return res.status(400).json({ message: 'Username và email không được để trống!' });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ message: 'Định dạng email không hợp lệ!' });
  }

  try {
    // Kiểm tra email hoặc username bị trùng với người khác
    const [existing] = await pool.query(
      'SELECT id FROM users WHERE (email = ? OR username = ?) AND id != ?',
      [email.trim(), username.trim(), userId]
    );

    if (existing.length > 0) {
      return res.status(409).json({ message: 'Username hoặc email đã được sử dụng bởi tài khoản khác!' });
    }

    await pool.query(
      'UPDATE users SET username = ?, email = ? WHERE id = ?',
      [username.trim(), email.trim(), userId]
    );

    // Lấy thông tin đã cập nhật
    const [updated] = await pool.query(
      'SELECT id, username, email, role FROM users WHERE id = ?',
      [userId]
    );

    res.json({
      message: 'Cập nhật thông tin thành công!',
      user: updated[0],
    });

  } catch (err) {
    console.error('Lỗi PUT /users/me:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/users/me/change-password
// Đổi mật khẩu
// ─────────────────────────────────────────────────────────────
router.put('/me/change-password', verifyToken, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const userId = req.user.id;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ message: 'Vui lòng nhập đầy đủ mật khẩu cũ và mật khẩu mới!' });
  }

  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
  }

  try {
    // Lấy mật khẩu hiện tại từ DB
    const [users] = await pool.query('SELECT password FROM users WHERE id = ?', [userId]);

    if (users.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản!' });
    }

    const isMatch = await bcrypt.compare(currentPassword, users[0].password);
    if (!isMatch) {
      return res.status(401).json({ message: 'Mật khẩu hiện tại không chính xác!' });
    }

    const hashedNew = await bcrypt.hash(newPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashedNew, userId]);

    res.json({ message: 'Đổi mật khẩu thành công!' });

  } catch (err) {
    console.error('Lỗi PUT /users/me/change-password:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

module.exports = router;
