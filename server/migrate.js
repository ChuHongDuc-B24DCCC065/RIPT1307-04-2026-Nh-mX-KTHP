// migrate.js
// Chạy: node migrate.js
// Script này sẽ tạo các bảng cần thiết cho diễn đàn

const pool = require('./config/db');

async function migrate() {
  console.log('🚀 Bắt đầu migration...\n');
  const conn = await pool.getConnection();

  try {
    // ─── 1. Cập nhật bảng questions ──────────────────────────
    console.log('📋 Kiểm tra bảng questions...');

    // Tạo bảng mới nếu chưa có
    await conn.query(`
      CREATE TABLE IF NOT EXISTS questions (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        title       VARCHAR(500)  NOT NULL,
        description TEXT          NOT NULL,
        tags        JSON,
        author_id   INT           NOT NULL DEFAULT 1,
        votes       INT           DEFAULT 0,
        answers     INT           DEFAULT 0,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP,
        updated_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Bảng questions OK');

    // Thêm các cột còn thiếu (dùng try/catch vì ALTER ADD sẽ lỗi nếu cột đã tồn tại)
    const columnsToAdd = [
      { name: 'description', sql: 'ADD COLUMN description TEXT NOT NULL' },
      { name: 'tags',        sql: 'ADD COLUMN tags JSON' },
      { name: 'author_id',   sql: 'ADD COLUMN author_id INT NOT NULL DEFAULT 1' },
      { name: 'votes',       sql: 'ADD COLUMN votes INT DEFAULT 0' },
      { name: 'answers',     sql: 'ADD COLUMN answers INT DEFAULT 0' },
      { name: 'updated_at',  sql: 'ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP' },
    ];

    const [existingCols] = await conn.query(`SHOW COLUMNS FROM questions`);
    const existingColNames = existingCols.map(c => c.Field);

    for (const col of columnsToAdd) {
      if (!existingColNames.includes(col.name)) {
        await conn.query(`ALTER TABLE questions ${col.sql}`);
        console.log(`   ➕ Đã thêm cột: questions.${col.name}`);
      }
    }

    // ─── 2. Tạo bảng comments ─────────────────────────────────
    console.log('\n📋 Kiểm tra bảng comments...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT           NOT NULL,
        author_id   INT           NOT NULL,
        content     TEXT          NOT NULL,
        created_at  TIMESTAMP     DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('   ✅ Bảng comments OK');

    // Thêm foreign keys nếu chưa có (safe check)
    try {
      await conn.query(`
        ALTER TABLE comments
        ADD CONSTRAINT fk_comments_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        ADD CONSTRAINT fk_comments_author   FOREIGN KEY (author_id)   REFERENCES users(id)     ON DELETE CASCADE
      `);
      console.log('   ✅ Foreign keys comments OK');
    } catch (e) {
      // Đã tồn tại - bỏ qua
      if (e.code !== 'ER_DUP_KEYNAME' && !e.message.includes('Duplicate')) {
        console.log('   ⚠️  FK comments (đã tồn tại hoặc bỏ qua):', e.message.substring(0, 60));
      }
    }

    // ─── 3. Tạo bảng question_votes ───────────────────────────
    console.log('\n📋 Kiểm tra bảng question_votes...');
    await conn.query(`
      CREATE TABLE IF NOT EXISTS question_votes (
        id          INT AUTO_INCREMENT PRIMARY KEY,
        question_id INT NOT NULL,
        user_id     INT NOT NULL,
        created_at  TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE KEY  uq_vote (question_id, user_id)
      )
    `);
    console.log('   ✅ Bảng question_votes OK');

    try {
      await conn.query(`
        ALTER TABLE question_votes
        ADD CONSTRAINT fk_votes_question FOREIGN KEY (question_id) REFERENCES questions(id) ON DELETE CASCADE,
        ADD CONSTRAINT fk_votes_user     FOREIGN KEY (user_id)     REFERENCES users(id)     ON DELETE CASCADE
      `);
      console.log('   ✅ Foreign keys question_votes OK');
    } catch (e) {
      if (e.code !== 'ER_DUP_KEYNAME' && !e.message.includes('Duplicate')) {
        console.log('   ⚠️  FK votes (đã tồn tại hoặc bỏ qua):', e.message.substring(0, 60));
      }
    }

    // ─── 4. Tạo indexes ───────────────────────────────────────
    console.log('\n📋 Tạo indexes...');
    const indexes = [
      { table: 'questions',      name: 'idx_questions_author',  col: 'author_id' },
      { table: 'questions',      name: 'idx_questions_created', col: 'created_at' },
      { table: 'comments',       name: 'idx_comments_question', col: 'question_id' },
      { table: 'question_votes', name: 'idx_votes_question',    col: 'question_id' },
    ];

    for (const idx of indexes) {
      try {
        await conn.query(`CREATE INDEX ${idx.name} ON ${idx.table} (${idx.col})`);
        console.log(`   ➕ Index ${idx.name} tạo thành công`);
      } catch (e) {
        // Index đã tồn tại - bỏ qua
        console.log(`   ✅ Index ${idx.name} OK`);
      }
    }

    console.log('\n✅ Migration hoàn thành thành công!');
    console.log('👉 Bây giờ hãy restart server: node index.js\n');

  } catch (err) {
    console.error('\n❌ Lỗi migration:', err.message);
    process.exit(1);
  } finally {
    conn.release();
    await pool.end();
  }
}

migrate();
