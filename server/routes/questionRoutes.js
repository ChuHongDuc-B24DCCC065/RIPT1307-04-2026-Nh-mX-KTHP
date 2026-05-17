// routes/questionRoutes.js
// API đầy đủ cho Questions: CRUD + Search + Filter

const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verifyToken, optionalAuth } = require('../middleware/auth');

// ─────────────────────────────────────────────────────────────
// GET /api/questions
// Lấy danh sách câu hỏi — Ai cũng xem được
// Query params: ?search=&tag=&sort=newest|votes|answers&page=1&limit=10
// ─────────────────────────────────────────────────────────────
router.get('/', optionalAuth, async (req, res) => {
  try {
    const { search = '', tag = '', sort = 'newest', page = 1, limit = 10 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    let whereConditions = [];
    let params = [];

    // Tìm kiếm theo tiêu đề hoặc mô tả
    if (search.trim()) {
      whereConditions.push('(q.title LIKE ? OR q.description LIKE ?)');
      params.push(`%${search}%`, `%${search}%`);
    }

    // Lọc theo tag (tìm trong JSON array)
    if (tag.trim()) {
      whereConditions.push('JSON_CONTAINS(q.tags, ?)');
      params.push(JSON.stringify(tag.trim()));
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Sắp xếp
    const orderMap = {
      newest:  'q.created_at DESC',
      votes:   'q.votes DESC',
      answers: 'q.answers DESC',
      oldest:  'q.created_at ASC',
    };
    const orderBy = orderMap[sort] || 'q.created_at DESC';

    // Đếm tổng số kết quả (cho phân trang)
    const [countResult] = await pool.query(
      `SELECT COUNT(*) AS total FROM questions q ${whereClause}`,
      params
    );
    const total = countResult[0].total;

    // Lấy dữ liệu với thông tin tác giả
    const [questions] = await pool.query(
      `SELECT 
          q.id, q.title, q.description, q.tags, q.votes, q.answers, q.created_at, q.updated_at,
          u.id AS author_id, u.username AS author, u.email AS author_email
       FROM questions q
       JOIN users u ON q.author_id = u.id
       ${whereClause}
       ORDER BY ${orderBy}
       LIMIT ? OFFSET ?`,
      [...params, parseInt(limit), offset]
    );

    // Parse tags từ JSON string sang array
    const formatted = questions.map(q => ({
      ...q,
      tags: typeof q.tags === 'string' ? JSON.parse(q.tags) : (q.tags || []),
      time: formatTime(q.created_at),
    }));

    res.json({
      questions: formatted,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      }
    });

  } catch (err) {
    console.error('Lỗi GET /questions:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/questions/:id
// Lấy chi tiết 1 câu hỏi kèm bình luận
// ─────────────────────────────────────────────────────────────
router.get('/:id', optionalAuth, async (req, res) => {
  const { id } = req.params;

  try {
    // Lấy câu hỏi
    const [questions] = await pool.query(
      `SELECT 
          q.id, q.title, q.description, q.tags, q.votes, q.answers, q.created_at, q.updated_at,
          u.id AS author_id, u.username AS author, u.email AS author_email
       FROM questions q
       JOIN users u ON q.author_id = u.id
       WHERE q.id = ?`,
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi!' });
    }

    const question = questions[0];

    // Lấy danh sách bình luận
    const [comments] = await pool.query(
      `SELECT 
          c.id, c.content, c.created_at,
          u.id AS author_id, u.username AS author
       FROM comments c
       JOIN users u ON c.author_id = u.id
       WHERE c.question_id = ?
       ORDER BY c.created_at ASC`,
      [id]
    );

    // Kiểm tra user hiện tại đã vote chưa
    let isVoted = false;
    if (req.user) {
      const [voteCheck] = await pool.query(
        'SELECT id FROM question_votes WHERE question_id = ? AND user_id = ?',
        [id, req.user.id]
      );
      isVoted = voteCheck.length > 0;
    }

    res.json({
      ...question,
      tags: typeof question.tags === 'string' ? JSON.parse(question.tags) : (question.tags || []),
      time: formatTime(question.created_at),
      comments: comments.map(c => ({
        ...c,
        time: formatTime(c.created_at),
      })),
      isVoted,
    });

  } catch (err) {
    console.error('Lỗi GET /questions/:id:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/questions
// Tạo câu hỏi mới — Cần đăng nhập
// ─────────────────────────────────────────────────────────────
router.post('/', verifyToken, async (req, res) => {
  const { title, description, tags } = req.body;

  if (!title || !title.trim()) {
    return res.status(400).json({ message: 'Tiêu đề không được để trống!' });
  }
  if (!description || !description.trim()) {
    return res.status(400).json({ message: 'Nội dung không được để trống!' });
  }
  if (title.trim().length < 10) {
    return res.status(400).json({ message: 'Tiêu đề quá ngắn (tối thiểu 10 ký tự)!' });
  }

  try {
    const tagsValue = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]);

    const [result] = await pool.query(
      `INSERT INTO questions (title, description, tags, author_id, votes, answers)
       VALUES (?, ?, ?, ?, 0, 0)`,
      [title.trim(), description.trim(), tagsValue, req.user.id]
    );

    const newId = result.insertId;

    // Lấy câu hỏi vừa tạo để trả về
    const [newQuestion] = await pool.query(
      `SELECT q.*, u.username AS author 
       FROM questions q JOIN users u ON q.author_id = u.id 
       WHERE q.id = ?`,
      [newId]
    );

    res.status(201).json({
      message: 'Đăng câu hỏi thành công!',
      question: {
        ...newQuestion[0],
        tags: tags || [],
        time: 'Vừa xong',
      }
    });

  } catch (err) {
    console.error('Lỗi POST /questions:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// PUT /api/questions/:id
// Sửa câu hỏi — Cần là chủ sở hữu hoặc admin
// ─────────────────────────────────────────────────────────────
router.put('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { title, description, tags } = req.body;

  try {
    // Kiểm tra câu hỏi tồn tại và quyền sở hữu
    const [questions] = await pool.query(
      'SELECT id, author_id FROM questions WHERE id = ?',
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi!' });
    }

    const question = questions[0];

    if (question.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền sửa câu hỏi này!' });
    }

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ message: 'Tiêu đề và nội dung không được để trống!' });
    }

    const tagsValue = Array.isArray(tags) ? JSON.stringify(tags) : JSON.stringify([]);

    await pool.query(
      'UPDATE questions SET title = ?, description = ?, tags = ? WHERE id = ?',
      [title.trim(), description.trim(), tagsValue, id]
    );

    res.json({ message: 'Cập nhật câu hỏi thành công!' });

  } catch (err) {
    console.error('Lỗi PUT /questions/:id:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// DELETE /api/questions/:id
// Xóa câu hỏi — Cần là chủ sở hữu hoặc admin
// ─────────────────────────────────────────────────────────────
router.delete('/:id', verifyToken, async (req, res) => {
  const { id } = req.params;

  try {
    const [questions] = await pool.query(
      'SELECT id, author_id FROM questions WHERE id = ?',
      [id]
    );

    if (questions.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi!' });
    }

    if (questions[0].author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Bạn không có quyền xóa câu hỏi này!' });
    }

    // Cascade: comments và votes sẽ tự xóa theo (FOREIGN KEY ON DELETE CASCADE)
    await pool.query('DELETE FROM questions WHERE id = ?', [id]);

    res.json({ message: 'Xóa câu hỏi thành công!' });

  } catch (err) {
    console.error('Lỗi DELETE /questions/:id:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// POST /api/questions/:id/vote
// Vote hoặc bỏ vote câu hỏi (toggle) — Cần đăng nhập
// ─────────────────────────────────────────────────────────────
router.post('/:id/vote', verifyToken, async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    // Kiểm tra câu hỏi tồn tại
    const [questions] = await pool.query('SELECT id, author_id FROM questions WHERE id = ?', [id]);
    if (questions.length === 0) {
      return res.status(404).json({ message: 'Không tìm thấy câu hỏi!' });
    }

    // Không cho tự vote câu hỏi của mình
    if (questions[0].author_id === userId) {
      return res.status(400).json({ message: 'Bạn không thể tự vote câu hỏi của mình!' });
    }

    // Kiểm tra đã vote chưa
    const [existing] = await pool.query(
      'SELECT id FROM question_votes WHERE question_id = ? AND user_id = ?',
      [id, userId]
    );

    let voted;
    if (existing.length > 0) {
      // Đã vote → bỏ vote
      await pool.query('DELETE FROM question_votes WHERE question_id = ? AND user_id = ?', [id, userId]);
      await pool.query('UPDATE questions SET votes = votes - 1 WHERE id = ?', [id]);
      voted = false;
    } else {
      // Chưa vote → thêm vote
      await pool.query('INSERT INTO question_votes (question_id, user_id) VALUES (?, ?)', [id, userId]);
      await pool.query('UPDATE questions SET votes = votes + 1 WHERE id = ?', [id]);
      voted = true;
    }

    // Lấy votes mới nhất
    const [updated] = await pool.query('SELECT votes FROM questions WHERE id = ?', [id]);

    res.json({
      message: voted ? 'Đã thích câu hỏi!' : 'Đã bỏ thích câu hỏi!',
      voted,
      votes: updated[0].votes,
    });

  } catch (err) {
    console.error('Lỗi POST /questions/:id/vote:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// GET /api/questions/user/:userId
// Lấy tất cả câu hỏi của một user
// ─────────────────────────────────────────────────────────────
router.get('/user/:userId', optionalAuth, async (req, res) => {
  const { userId } = req.params;

  try {
    const [questions] = await pool.query(
      `SELECT 
          q.id, q.title, q.description, q.tags, q.votes, q.answers, q.created_at,
          u.username AS author
       FROM questions q
       JOIN users u ON q.author_id = u.id
       WHERE q.author_id = ?
       ORDER BY q.created_at DESC`,
      [userId]
    );

    const formatted = questions.map(q => ({
      ...q,
      tags: typeof q.tags === 'string' ? JSON.parse(q.tags) : (q.tags || []),
      time: formatTime(q.created_at),
    }));

    res.json({ questions: formatted });

  } catch (err) {
    console.error('Lỗi GET /questions/user/:userId:', err);
    res.status(500).json({ message: 'Lỗi server: ' + err.message });
  }
});

// ─── Helper: Format thời gian tương đối ──────────────────────
function formatTime(date) {
  if (!date) return '';
  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1)   return 'Vừa xong';
  if (diffMins < 60)  return `${diffMins} phút trước`;
  const diffHours = Math.floor(diffMins / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays < 30)  return `${diffDays} ngày trước`;
  const diffMonths = Math.floor(diffDays / 30);
  if (diffMonths < 12) return `${diffMonths} tháng trước`;
  return `${Math.floor(diffMonths / 12)} năm trước`;
}

module.exports = router;
