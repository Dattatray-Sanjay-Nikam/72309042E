import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Card,
  CardContent,
  Chip,
  List,
  ListItem,
  ListItemText,
  CircularProgress,
  Alert,
} from '@mui/material';
import PriorityHighIcon from '@mui/icons-material/PriorityHigh';
import { notificationAPI } from '../utils/api';

const PriorityInbox = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchPriorityNotifications();
  }, []);

  const fetchPriorityNotifications = async () => {
    try {
      setLoading(true);
      const response = await notificationAPI.getPriorityNotifications();
      setNotifications(response.data.priorityNotifications || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch priority notifications');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'critical':
        return '#ff3333';
      case 'high':
        return '#ff9800';
      case 'normal':
        return '#2196f3';
      case 'low':
        return '#9e9e9e';
      default:
        return '#2196f3';
    }
  };

  const getTypeVariant = (type) => {
    switch (type) {
      case 'Placement':
        return 'filled';
      case 'Result':
        return 'outlined';
      case 'Event':
        return 'outlined';
      default:
        return 'outlined';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" py={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Card sx={{ bgcolor: '#fff3e0', border: '2px solid #ff9800' }}>
      <CardContent>
        <Box display="flex" alignItems="center" mb={2}>
          <PriorityHighIcon sx={{ color: '#ff9800', mr: 1, fontSize: 28 }} />
          <Typography variant="h6" component="div">
            ⭐ Top 10 Priority Notifications ({notifications.length})
          </Typography>
        </Box>

        {notifications.length === 0 ? (
          <Typography color="textSecondary" variant="body2">
            No priority notifications at the moment
          </Typography>
        ) : (
          <List sx={{ width: '100%' }}>
            {notifications.map((notif, index) => (
              <ListItem
                key={notif.id}
                sx={{
                  bgcolor: '#fffde7',
                  mb: 1,
                  borderRadius: 1,
                  borderLeft: `3px solid ${getPriorityColor(notif.priority)}`,
                }}
              >
                <ListItemText
                  primary={
                    <Box display="flex" alignItems="center" gap={1}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>
                        #{index + 1}
                      </Typography>
                      <Chip
                        label={notif.type}
                        size="small"
                        variant={getTypeVariant(notif.type)}
                      />
                      <Typography variant="body2">{notif.message}</Typography>
                    </Box>
                  }
                  secondary={`Priority: ${notif.priority} | Score: ${Math.round(notif.priority_score || 0)}`}
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default PriorityInbox;
