-- ============================================================
-- Schema cho Diễn đàn Hỏi Đáp Sinh Viên
-- Chạy file này trong MySQL Workbench hoặc terminal:
--   mysql -u root -p diendanhoidapsinhvien < schema.sql
-- ============================================================

USE diendanhoidapsinhvien;

-- ─── Bảng questions ────────────────────────────────────────
-- Thêm cột còn thiếu nếu bảng đã tồn tại
CREATE TABLE IF NOT EXISTS questions (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    title       VARCHAR(500)  NOT NULL,
    description TEXT          NOT NULL,
    tags        JSON          DEFAULT (JSON_ARRAY()),
    author_id   INT           NOT NULL,
    votes       INT           DEFAULT 0,
    answers     INT           DEFAULT 0,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (author_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Thêm cột cho bảng questions nếu thiếu (khi bảng đã tồn tại trước)
ALTER TABLE questions
    ADD COLUMN IF NOT EXISTS description TEXT          NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS tags        JSON          DEFAULT (JSON_ARRAY()),
    ADD COLUMN IF NOT EXISTS author_id   INT           NOT NULL DEFAULT 1,
    ADD COLUMN IF NOT EXISTS votes       INT           DEFAULT 0,
    ADD COLUMN IF NOT EXISTS answers     INT           DEFAULT 0,
    ADD COLUMN IF NOT EXISTS updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- ─── Bảng comments ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS comments (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT           NOT NULL,
    author_id   INT           NOT NULL,
    content     TEXT          NOT NULL,
    created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (author_id)   REFERENCES users(id)     ON DELETE CASCADE
);

-- ─── Bảng votes ────────────────────────────────────────────
-- Mỗi user chỉ vote được 1 lần cho mỗi câu hỏi (UNIQUE)
CREATE TABLE IF NOT EXISTS question_votes (
    id          INT AUTO_INCREMENT PRIMARY KEY,
    question_id INT NOT NULL,
    user_id     INT NOT NULL,
    created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY  uq_vote (question_id, user_id),
    FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
);

-- ─── Index để tăng tốc độ tìm kiếm ─────────────────────────
CREATE INDEX IF NOT EXISTS idx_questions_author  ON questions (author_id);
CREATE INDEX IF NOT EXISTS idx_questions_created ON questions (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_comments_question ON comments  (question_id);
CREATE INDEX IF NOT EXISTS idx_votes_question    ON question_votes (question_id);

SELECT 'Schema khởi tạo thành công!' AS message;
