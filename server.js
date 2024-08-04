const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');
require('dotenv').config();

const app = express();
const path = require('path');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Gunakan port dari variabel lingkungan atau default ke 8000
const port = process.env.PORT || 8000;

// Pastikan path ke folder statis sesuai
app.use(express.static(path.join(__dirname, 'public')));

wss.on('connection', (ws) => {
  console.log('WebSocket connection established.');

  // Buat koneksi ke TikTok Live
  const tiktokLiveConnection = new WebcastPushConnection(process.env.TIKTOK_USERNAME);
  
  tiktokLiveConnection.connect().then(state => {
    console.info(`Listening to live data: ${state.roomId}`);
  }).catch(err => {
    console.error('Failed to connect:', err);
  });

  // Kirim data chat ke klien WebSocket
  tiktokLiveConnection.on('chat', data => {
    data.type = 'chat';
    ws.send(JSON.stringify(data));
  });

  // Kirim data like ke klien WebSocket
  tiktokLiveConnection.on('like', data => {
    data.type = 'like';
    ws.send(JSON.stringify(data));
  });

  // Tangani penutupan koneksi WebSocket
  ws.on('close', () => {
    console.log('WebSocket connection closed');
    tiktokLiveConnection.disconnect(); // Disconnect when WebSocket connection is closed
  });

  // Tangani error WebSocket
  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

// Jalankan server
server.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
