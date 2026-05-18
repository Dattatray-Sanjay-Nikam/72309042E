import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
  Stack,
  Pagination,
} from '@mui/material';
import Layout from '../components/Layout';
import NotificationCard from '../components/NotificationCard';
import FilterTabs from '../components/FilterTabs';
import PriorityInbox from '../components/PriorityInbox';
import { notificationAPI } from '../utils/api';

export default function Home() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 10;

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [filter, page]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      let type = null;
      let isRead = null;

      if (filter === 'unread') {
        isRead = false;
      } else if (filter !== 'all') {
        type = filter;
      }

      const response = await notificationAPI.getNotifications(limit, page, type, isRead);
      
      setNotifications(response.data.notifications || []);
      setTotalPages(response.data.totalPages || 1);
      setError(null);
    } catch (err) {
      setError('Failed to fetch notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.data.unreadCount || 0);
    } catch (err) {
      console.error('Failed to fetch unread count:', err);
    }
  };

  const handleMarkRead = async (notificationId) => {
    try {
      await notificationAPI.markAsRead(notificationId);
      setNotifications((prev) =>
        prev.map((notif) =>
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
      await fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark as read:', err);
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await notificationAPI.deleteNotification(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      await fetchUnreadCount();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await notificationAPI.markAllAsRead();
      setNotifications((prev) =>
        prev.map((n) => ({ ...n, is_read: true }))
      );
      await fetchUnreadCount();
    } catch (err) {
      console.error('Failed to mark all as read:', err);
    }
  };

  return (
    <Layout unreadCount={unreadCount}>
      <Box sx={{ py: 4 }}>
        {/* Header */}
        <Box sx={{ mb: 4 }}>
          <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold' }}>
            📬 Your Notifications
          </Typography>
          <Typography variant="body1" color="textSecondary">
            You have <strong>{unreadCount} unread</strong> notification{unreadCount !== 1 ? 's' : ''}
          </Typography>
        </Box>

        {/* Priority Inbox */}
        <Box sx={{ mb: 4 }}>
          <PriorityInbox />
        </Box>

        {/* Filters and Actions */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <FilterTabs activeFilter={filter} onFilterChange={(newFilter) => {
            setFilter(newFilter);
            setPage(1);
          }} />
          {unreadCount > 0 && (
            <Button
              variant="contained"
              color="success"
              onClick={handleMarkAllRead}
            >
              ✓ Mark All Read
            </Button>
          )}
        </Box>

        {/* Error Message */}
        {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

        {/* Loading State */}
        {loading ? (
          <Box display="flex" justifyContent="center" py={6}>
            <CircularProgress />
          </Box>
        ) : notifications.length === 0 ? (
          <Alert severity="info">
            No notifications found. {filter !== 'all' && 'Try a different filter.'}
          </Alert>
        ) : (
          <>
            {/* Notifications List */}
            <Box>
              {notifications.map((notification) => (
                <NotificationCard
                  key={notification.id}
                  notification={notification}
                  onMarkRead={handleMarkRead}
                  onDelete={handleDelete}
                />
              ))}
            </Box>

            {/* Pagination */}
            {totalPages > 1 && (
              <Stack spacing={2} alignItems="center" sx={{ mt: 4 }}>
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={(event, value) => setPage(value)}
                  color="primary"
                />
              </Stack>
            )}
          </>
        )}
      </Box>
    </Layout>
  );
}
