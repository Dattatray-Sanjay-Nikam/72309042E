import React from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Badge,
  IconButton,
  Box,
  Container,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';

export default function Layout({ children, unreadCount = 0 }) {
  return (
    <>
      <AppBar position="sticky">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            🔔 Notification System
          </Typography>
          <IconButton color="inherit">
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
        </Toolbar>
      </AppBar>
      <Box sx={{ bgcolor: '#f5f5f5', minHeight: '100vh', py: 3 }}>
        <Container maxWidth="lg">
          {children}
        </Container>
      </Box>
    </>
  );
}
