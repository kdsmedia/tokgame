const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const { WebcastPushConnection } = require('tiktok-live-connector');
require('dotenv').config();

const app = express();
const path = require('path');
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const port = 8000;

app.use(express.static(path.join(__dirname + '/src')));

wss.on('connection', (ws) => {
  console.log('Jogo ouvindo o websocket.');

  const tiktokLiveConnection = new WebcastPushConnection(process.env.TIKTOK_USERNAME);
  tiktokLiveConnection.connect().then(state => {
    console.info(`Escutando dados da live: ${state.roomId}`);
  }).catch(err => {
    console.error('Falha ao conectar', err);
  });

  tiktokLiveConnection.on('chat', data => {
    data.type = 'chat';
    ws.send(JSON.stringify(data));
  });

  tiktokLiveConnection.on('like', data => {
    data.type = 'like';
    ws.send(JSON.stringify(data));
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    tiktokLiveConnection.disconnect(); // Disconnect when WebSocket connection is closed
  });

  ws.on('error', (error) => {
    console.error('WebSocket error:', error);
  });
});

server.listen(port, () => {
  console.log(`Servidor está rodando em http://localhost:${port}`);
});
