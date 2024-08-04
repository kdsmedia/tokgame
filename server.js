const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');
const path = require('path');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Gunakan PORT dari variabel lingkungan atau default ke 8000
const port = process.env.PORT || 8000;

// Menyajikan file statis dari direktori src
app.use(express.static(path.join(__dirname, '/src')));

// Menjalankan server HTTP dan WebSocket pada port yang sama
server.listen(port, () => {
  console.log(`Server berjalan di http://localhost:${port}`);
  console.log('Server WebSocket aktif.');
});

// Membuat koneksi ke TikTok Live
const tiktokLiveConnection = new WebcastPushConnection(''); // Ganti dengan username yang sesuai

tiktokLiveConnection.connect().then(state => {
  console.info(`Mendengarkan data live: ${state.roomId}`);
}).catch(err => {
  console.error('Gagal terhubung', err);
});

// Mengatur koneksi WebSocket
wss.on('connection', (ws) => {
  console.log('WebSocket terhubung.');

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
});
