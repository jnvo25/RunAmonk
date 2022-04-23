// Setup Express server
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

server.listen(process.env.PORT || 8080, () => { // Uses port set by heroku
  console.log(`Listening on ${server.address().port}`);
});

// Handle game logic
const GameObject = require('./public/js/game');

const Game = new GameObject();

// Handle connections
io.on('connection', (socket) => {
  Game.addPlayer(socket.id);

  socket.on('disconnect', () => {
    Game.deletePlayer(socket.id);
  });

  socket.on('client_playerReady', () => {
    Game.updateReadyPlayer(socket.id);
    io.emit('server_waitingRoomUpdate', Array.from(Game.players.get('waiting').values()));
  });
});
