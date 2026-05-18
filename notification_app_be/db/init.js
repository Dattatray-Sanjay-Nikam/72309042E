const pool = require('./db/pool');
require('dotenv').config();

async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database schema...');

    // Create students table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS students (
        id SERIAL PRIMARY KEY,
        student_id VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Students table created');

    // Create notification types enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE notification_type AS ENUM ('Event', 'Result', 'Placement');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Notification type enum created');

    // Create priority level enum
    await pool.query(`
      DO $$ BEGIN
        CREATE TYPE priority_level AS ENUM ('low', 'normal', 'high', 'critical');
      EXCEPTION WHEN duplicate_object THEN null;
      END $$;
    `);
    console.log('✅ Priority level enum created');

    // Create notifications table
    await pool.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        student_id INT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
        type VARCHAR(50) NOT NULL CHECK (type IN ('Event', 'Result', 'Placement')),
        message TEXT NOT NULL,
        is_read BOOLEAN DEFAULT FALSE,
        priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'critical')),
        priority_score INT DEFAULT 0,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        metadata JSONB
      )
    `);
    console.log('✅ Notifications table created');

    // Create indexes
    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_student_id 
      ON notifications(student_id)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_is_read 
      ON notifications(is_read)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_type 
      ON notifications(type)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_created_at 
      ON notifications(created_at DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_priority_score 
      ON notifications(priority_score DESC)
    `);

    await pool.query(`
      CREATE INDEX IF NOT EXISTS idx_notifications_student_unread 
      ON notifications(student_id, is_read) 
      WHERE is_read = false
    `);

    console.log('✅ All indexes created');

    // Insert sample data
    console.log('\n📝 Inserting sample data...');

    // Insert sample student
    const studentResult = await pool.query(`
      INSERT INTO students (student_id, name, email)
      VALUES ($1, $2, $3)
      ON CONFLICT (student_id) DO NOTHING
      RETURNING id
    `, ['1042', 'John Doe', 'john@example.com']);

    if (studentResult.rows.length > 0) {
      const studentInternalId = studentResult.rows[0].id;

      // Insert sample notifications
      const notifications = [
        {
          student_id: studentInternalId,
          type: 'Placement',
          message: 'Job offer from TCS - Junior Developer Position',
          priority: 'critical',
          is_read: false
        },
        {
          student_id: studentInternalId,
          type: 'Result',
          message: 'Mid-sem result published for Mathematics',
          priority: 'high',
          is_read: false
        },
        {
          student_id: studentInternalId,
          type: 'Event',
          message: 'Tech Fest 2026 - Registration open',
          priority: 'normal',
          is_read: true
        },
        {
          student_id: studentInternalId,
          type: 'Placement',
          message: 'CSX Corporation hiring drive',
          priority: 'high',
          is_read: false
        },
        {
          student_id: studentInternalId,
          type: 'Event',
          message: 'Farewell party - Save the date',
          priority: 'low',
          is_read: false
        }
      ];

      for (const notif of notifications) {
        await pool.query(`
          INSERT INTO notifications (student_id, type, message, priority, is_read)
          VALUES ($1, $2, $3, $4, $5)
        `, [notif.student_id, notif.type, notif.message, notif.priority, notif.is_read]);
      }

      console.log(`✅ ${notifications.length} sample notifications inserted`);
    }

    console.log('\n✅ Database initialization completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    process.exit(1);
  }
}

initializeDatabase();
