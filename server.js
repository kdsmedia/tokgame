const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = 8000;

// Menyajikan file statis dari direktori src
app.use(express.static(path.join(__dirname, '/src')));

// Middleware untuk meng-parse JSON
app.use(express.json());

// Menjalankan server HTTP dan WebSocket pada port yang sama
server.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  console.log('Server WebSocket aktif.');
});

let tiktokLiveConnection; // Variabel global untuk koneksi TikTok Live

// Endpoint untuk menerima username
app.post('/submit-username', (req, res) => {
  const username = req.body.username;
  console.log('Received username:', username);

  if (tiktokLiveConnection) {
    tiktokLiveConnection.disconnect(); // Putuskan koneksi sebelumnya jika ada
  }

  // Membuat koneksi baru ke TikTok Live
  tiktokLiveConnection = new WebcastPushConnection(username);

  tiktokLiveConnection.connect().then(state => {
    console.info(`Mendengarkan data live: ${state.roomId}`);
    res.status(200).send('Username received and connection established');
  }).catch(err => {
    console.error('Gagal terhubung', err);
    res.status(500).send('Failed to connect');
  });
});

// Mengatur koneksi WebSocket
wss.on('connection', (ws) => {
  console.log('WebSocket terhubung.');

  if (tiktokLiveConnection) {
    // Mengirimkan data chat dari TikTok Live ke klien WebSocket
    tiktokLiveConnection.on('chat', data => {
      data.type = 'chat';
      ws.send(JSON.stringify(data));
    });

    // Mengirimkan data like dari TikTok Live ke klien WebSocket
    tiktokLiveConnection.on('like', data => {
      data.type = 'like';
      ws.send(JSON.stringify(data));
    });
  } else {
    ws.send(JSON.stringify({ error: 'No TikTok connection established' }));
  }
});
