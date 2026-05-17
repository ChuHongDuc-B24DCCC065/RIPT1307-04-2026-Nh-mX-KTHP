const express = require('express');
const mysql = require('mysql2/promise'); 
const bcrypt = require('bcrypt');
const cors = require('cors');
const jwt = require('jsonwebtoken'); 

const app = express();
app.use(express.json());
app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true
}));

// Import pool từ config
const pool = require('./config/db');

// Test connection
pool.getConnection()
    .then(conn => {
        console.log("✅ Đã kết nối MySQL thành công!");
        conn.release();
    })
    .catch(err => console.log("❌ Lỗi kết nối MySQL: ", err));

// ─────────────────────────────────────────────────────────────
// API ĐĂNG KÝ
// ─────────────────────────────────────────────────────────────
app.post('/api/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ thông tin!" });
    }

    try {
        // Kiểm tra email/username đã tồn tại
        const [existing] = await pool.execute(
            'SELECT id FROM users WHERE email = ? OR username = ?',
            [email.trim(), username.trim()]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: "Email hoặc tên đăng nhập đã được sử dụng!" });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        await pool.execute(
            'INSERT INTO users (username, email, password, role) VALUES (?, ?, ?, ?)',
            [username.trim(), email.trim(), hashedPassword, role || 'student']
        );
        res.status(201).json({ message: "Đăng ký thành công!" });
    } catch (err) {
        console.error("LỖI SQL:", err.message); 
        res.status(500).json({ message: "Lỗi hệ thống: " + err.message });
    }
});

// ─────────────────────────────────────────────────────────────
// API ĐĂNG NHẬP
// ─────────────────────────────────────────────────────────────
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body; 

    if (!email || !password) {
        return res.status(400).json({ message: "Vui lòng nhập đầy đủ Email và Mật khẩu!" });
    }

    try {
        const [rows] = await pool.execute('SELECT * FROM users WHERE email = ?', [email]);
        
        if (rows.length === 0) {
            return res.status(404).json({ message: "Tài khoản không tồn tại trên hệ thống!" });
        }

        const user = rows[0];
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(401).json({ message: "Mật khẩu không chính xác, vui lòng thử lại!" });
        }

        const token = jwt.sign(
            { 
                id: user.id, 
                username: user.username,
                email: user.email,
                role: user.role
            }, 
            'bi_mat_quoc_gia', 
            { expiresIn: '7d' }
        );

        res.json({
            success: true,
            message: "Đăng nhập thành công!",
            token: token,
            user: {
                id: user.id,
                username: user.username,
                role: user.role,
                email: user.email
            }
        });

        console.log(`✅ User ${user.username} (${user.role}) đăng nhập thành công.`);

    } catch (err) {
        console.error("LỖI LOGIN:", err.message);
        res.status(500).json({ message: "Lỗi hệ thống khi xử lý đăng nhập!" });
    }
});

// ─────────────────────────────────────────────────────────────
// ĐĂNG KÝ CÁC ROUTES
// ─────────────────────────────────────────────────────────────
const questionRoutes = require('./routes/questionRoutes');
const commentRoutes  = require('./routes/commentRoutes');
const userRoutes     = require('./routes/userRoutes');
const adminRoutes    = require('./routes/adminRoutes');

// Questions CRUD + Vote
app.use('/api/questions', questionRoutes);

// Comments: mount dưới questions/:id/comments (mergeParams: true trong commentRoutes)
app.use('/api/questions/:id/comments', commentRoutes);

// User profile
app.use('/api/users', userRoutes);

// Admin (chỉ dành cho admin)
app.use('/api/admin', adminRoutes);

// ─────────────────────────────────────────────────────────────
// HEALTH CHECK
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', message: 'Server đang chạy bình thường!' });
});

app.listen(5000, () => console.log("🚀 Server chạy ở cổng 5000"));