import React from 'react';
import {
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { format } from 'date-fns';

const NotificationCard = ({ notification, onMarkRead, onDelete }) => {
  const getTypeColor = (type) => {
    switch (type) {
      case 'Placement':
        return 'error';
      case 'Result':
        return 'warning';
      case 'Event':
        return 'info';
      default:
        return 'default';
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

  const formatDate = (date) => {
    try {
      return format(new Date(date), 'MMM dd, yyyy HH:mm');
    } catch (e) {
      return new Date(date).toLocaleString();
    }
  };

  return (
    <Card
      sx={{
        mb: 2,
        opacity: notification.is_read ? 0.7 : 1,
        borderLeft: `4px solid ${getPriorityColor(notification.priority)}`,
        transition: 'all 0.3s ease',
        '&:hover': {
          boxShadow: 3,
          transform: 'translateY(-2px)',
        },
      }}
    >
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="start" mb={1}>
          <Box>
            <Chip
              label={notification.type}
              color={getTypeColor(notification.type)}
              size="small"
              sx={{ mr: 1 }}
            />
            <Chip
              label={notification.priority}
              size="small"
              sx={{
                bgcolor: getPriorityColor(notification.priority),
                color: 'white',
              }}
            />
          </Box>
          {notification.is_read && (
            <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
          )}
        </Box>

        <Typography variant="h6" component="div" sx={{ mb: 1 }}>
          {notification.message}
        </Typography>

        <Typography variant="caption" color="textSecondary" display="block">
          📅 {formatDate(notification.created_at)}
        </Typography>
      </CardContent>

      <CardActions>
        {!notification.is_read && (
          <Button
            size="small"
            onClick={() => onMarkRead(notification.id)}
            startIcon={<CheckCircleIcon />}
          >
            Mark as Read
          </Button>
        )}
        <Button
          size="small"
          color="error"
          startIcon={<DeleteIcon />}
          onClick={() => onDelete(notification.id)}
        >
          Delete
        </Button>
      </CardActions>
    </Card>
  );
};

export default NotificationCard;
