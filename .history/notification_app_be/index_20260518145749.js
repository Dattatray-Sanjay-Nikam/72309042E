const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const WebSocket = require('ws');
const http = require('http');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3001;
const WS_PORT = process.env.WS_PORT || 8080;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Import routes
const notificationRoutes = require('./routes/notifications');

// Routes
app.use('/api/notifications', notificationRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Notification API Server running on port ${PORT}`);
  console.log(`📍 Base URL: http://localhost:${PORT}`);
  console.log(`🔗 Notifications endpoint: http://localhost:${PORT}/api/notifications`);
});

// WebSocket Server for Real-Time Notifications
const wss = new WebSocket.Server({ port: WS_PORT });

wss.on('connection', (ws) => {
  console.log('New WebSocket connection');

  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      console.log('Received:', data);
      
      // Echo back as acknowledgment
      ws.send(JSON.stringify({
        type: 'ack',
        message: 'Message received',
        timestamp: new Date().toISOString()
      }));
    } catch (error) {
      console.error('Error processing message:', error);
    }
  });

  // Heartbeat
  const heartbeatInterval = setInterval(() => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: 'heartbeat',
        timestamp: new Date().toISOString()
      }));
    }
  }, 30000);

  ws.on('close', () => {
    clearInterval(heartbeatInterval);
    console.log('WebSocket connection closed');
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

console.log(`🔴 WebSocket Server running on port ${WS_PORT}`);
console.log(`🔗 Connect to: ws://localhost:${WS_PORT}`);

module.exports = app;
