// middleware/auth.js
// Middleware xác thực JWT dùng chung cho tất cả routes

const jwt = require('jsonwebtoken');
const JWT_SECRET = 'bi_mat_quoc_gia';

/**
 * Middleware bắt buộc phải đăng nhập.
 * Attach req.user = { id, username, email, role } nếu hợp lệ.
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Bạn cần đăng nhập để thực hiện hành động này!' });
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ message: 'Token không hợp lệ hoặc đã hết hạn, vui lòng đăng nhập lại!' });
    }
    req.user = decoded;
    next();
  });
}

/**
 * Middleware tuỳ chọn: gắn req.user nếu có token, không bắt buộc.
 * Dùng cho các route xem công khai nhưng cần biết ai đang xem.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.headers['authorization'];

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    req.user = null;
    return next();
  }

  const token = authHeader.split(' ')[1];

  jwt.verify(token, JWT_SECRET, (err, decoded) => {
    req.user = err ? null : decoded;
    next();
  });
}

/**
 * Middleware kiểm tra quyền Admin.
 * Phải dùng sau verifyToken.
 */
function isAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Chỉ Admin mới có quyền thực hiện hành động này!' });
  }
  next();
}

module.exports = { verifyToken, optionalAuth, isAdmin };
