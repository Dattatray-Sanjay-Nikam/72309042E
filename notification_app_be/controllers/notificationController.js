const pool = require('../db/pool');
const redis = require('../cache/redis');

// Get all notifications for a student
exports.getNotifications = async (req, res) => {
  try {
    const { studentId } = req.user;
    const { limit = 20, page = 1, notification_type, is_read } = req.query;

    const offset = (page - 1) * limit;
    let query = `
      SELECT id, student_id, type, message, is_read, priority, created_at
      FROM notifications
      WHERE student_id = (SELECT id FROM students WHERE student_id = $1)
    `;
    const params = [studentId];
    let paramIndex = 2;

    if (notification_type) {
      query += ` AND type = $${paramIndex}`;
      params.push(notification_type);
      paramIndex++;
    }

    if (is_read !== undefined) {
      query += ` AND is_read = $${paramIndex}`;
      params.push(is_read === 'true');
      paramIndex++;
    }

    query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await pool.query(query, params);

    // Get total count
    let countQuery = `
      SELECT COUNT(*) FROM notifications
      WHERE student_id = (SELECT id FROM students WHERE student_id = $1)
    `;
    const countParams = [studentId];

    if (notification_type) {
      countQuery += ` AND type = $2`;
      countParams.push(notification_type);
    }

    const countResult = await pool.query(countQuery, countParams);
    const total = parseInt(countResult.rows[0].count);

    res.json({
      success: true,
      data: {
        notifications: result.rows,
        total,
        page,
        pageSize: limit,
        totalPages: Math.ceil(total / limit)
      },
      message: 'Notifications fetched successfully'
    });
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch notifications',
      error: error.message
    });
  }
};

// Get priority notifications (Top 10)
exports.getPriorityNotifications = async (req, res) => {
  try {
    const { studentId } = req.user;

    // Try cache first
    const cacheKey = `priority_notifications:${studentId}`;
    const cached = await new Promise((resolve) => {
      redis.get(cacheKey, (err, data) => {
        resolve(data);
      });
    });

    if (cached) {
      return res.json(JSON.parse(cached));
    }

    // Query with priority scoring
    const query = `
      SELECT 
        id,
        type,
        message,
        is_read,
        created_at,
        priority,
        (
          CASE type
            WHEN 'Placement' THEN 100
            WHEN 'Result' THEN 50
            WHEN 'Event' THEN 20
          END +
          CASE WHEN is_read = false THEN 30 ELSE 0 END +
          CASE WHEN priority = 'critical' THEN 50
               WHEN priority = 'high' THEN 25
               WHEN priority = 'normal' THEN 10
               ELSE 0
          END +
          CAST(EXTRACT(EPOCH FROM (CURRENT_TIMESTAMP - created_at)) / 3600 AS INT)
        ) as priority_score
      FROM notifications
      WHERE student_id = (SELECT id FROM students WHERE student_id = $1)
      ORDER BY priority_score DESC
      LIMIT 10
    `;

    const result = await pool.query(query, [studentId]);

    const response = {
      success: true,
      data: {
        priorityNotifications: result.rows,
        count: result.rows.length,
        timestamp: new Date().toISOString()
      },
      message: 'Priority notifications fetched successfully'
    };

    // Cache for 2 minutes
    await new Promise((resolve) => {
      redis.setex(cacheKey, 120, JSON.stringify(response), (err) => {
        resolve();
      });
    });

    res.json(response);
  } catch (error) {
    console.error('Error fetching priority notifications:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch priority notifications',
      error: error.message
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { studentId } = req.user;
    const { notificationId } = req.params;

    const query = `
      UPDATE notifications
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE id = $1 AND student_id = (SELECT id FROM students WHERE student_id = $2)
      RETURNING id, is_read, updated_at
    `;

    const result = await pool.query(query, [notificationId, studentId]);

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Invalidate cache
    await new Promise((resolve) => {
      redis.del(`priority_notifications:${studentId}`, (err) => {
        resolve();
      });
    });

    res.json({
      success: true,
      data: result.rows[0],
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark notification as read',
      error: error.message
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const { studentId } = req.user;

    const query = `
      UPDATE notifications
      SET is_read = true, updated_at = CURRENT_TIMESTAMP
      WHERE student_id = (SELECT id FROM students WHERE student_id = $1) AND is_read = false
      RETURNING id
    `;

    const result = await pool.query(query, [studentId]);

    // Invalidate cache
    await new Promise((resolve) => {
      redis.del(`priority_notifications:${studentId}`, (err) => {
        resolve();
      });
    });

    res.json({
      success: true,
      data: {
        updatedCount: result.rowCount,
        timestamp: new Date().toISOString()
      },
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to mark all notifications as read',
      error: error.message
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { studentId } = req.user;
    const { notificationId } = req.params;

    const query = `
      DELETE FROM notifications
      WHERE id = $1 AND student_id = (SELECT id FROM students WHERE student_id = $2)
    `;

    const result = await pool.query(query, [notificationId, studentId]);

    if (result.rowCount === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found'
      });
    }

    // Invalidate cache
    await new Promise((resolve) => {
      redis.del(`priority_notifications:${studentId}`, (err) => {
        resolve();
      });
    });

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting notification:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete notification',
      error: error.message
    });
  }
};

// Get unread count
exports.getUnreadCount = async (req, res) => {
  try {
    const { studentId } = req.user;

    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE is_read = false) as unreadCount,
        COUNT(*) as totalCount
      FROM notifications
      WHERE student_id = (SELECT id FROM students WHERE student_id = $1)
    `;

    const result = await pool.query(query, [studentId]);

    res.json({
      success: true,
      data: {
        unreadCount: parseInt(result.rows[0].unreadcount),
        totalCount: parseInt(result.rows[0].totalcount)
      },
      message: 'Count retrieved successfully'
    });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch unread count',
      error: error.message
    });
  }
};
