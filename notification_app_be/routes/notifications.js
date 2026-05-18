const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const auth = require('../middleware/auth');

// All routes require authentication
router.use(auth);

// Get all notifications
router.get('/', notificationController.getNotifications);

// Get priority notifications (top 10)
router.get('/priority/top', notificationController.getPriorityNotifications);

// Get unread count
router.get('/count/unread', notificationController.getUnreadCount);

// Mark notification as read
router.patch('/:notificationId/read', notificationController.markAsRead);

// Mark all notifications as read
router.patch('/mark-all-read', notificationController.markAllAsRead);

// Delete notification
router.delete('/:notificationId', notificationController.deleteNotification);

module.exports = router;
