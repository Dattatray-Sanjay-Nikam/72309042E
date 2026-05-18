import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

// Mock token (in production, get from authentication)
const MOCK_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdHVkZW50SWQiOiIxMDQyIn0.mock';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${MOCK_TOKEN}`
  }
});

// Error handling
apiClient.interceptors.response.use(
  (response) => response.data,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    throw error;
  }
);

export const notificationAPI = {
  // Get all notifications
  getNotifications: (limit = 20, page = 1, type = null, isRead = null) => {
    let url = `/notifications?limit=${limit}&page=${page}`;
    if (type) url += `&notification_type=${type}`;
    if (isRead !== null) url += `&is_read=${isRead}`;
    return apiClient.get(url);
  },

  // Get priority notifications (top 10)
  getPriorityNotifications: () => {
    return apiClient.get('/notifications/priority/top');
  },

  // Get unread count
  getUnreadCount: () => {
    return apiClient.get('/notifications/count/unread');
  },

  // Mark as read
  markAsRead: (notificationId) => {
    return apiClient.patch(`/notifications/${notificationId}/read`);
  },

  // Mark all as read
  markAllAsRead: () => {
    return apiClient.patch('/notifications/mark-all-read');
  },

  // Delete notification
  deleteNotification: (notificationId) => {
    return apiClient.delete(`/notifications/${notificationId}`);
  }
};

export default apiClient;
