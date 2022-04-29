// Setup Express server
const express = require('express');
const path = require('path');

const app = express();
const server = require('http').Server(app);
const io = require('socket.io')(server);
const { GAME_STATUS } = require('./public/js/config');

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/index.html'));
});

server.listen(process.env.PORT || 8080, () => { // Uses port set by heroku
  // eslint-disable-next-line no-console
  console.log(`Listening on ${server.address().port}`);
});

// Handle game logic
const GameObject = require('./public/js/game');

const Game = new GameObject();

// Handle connections
io.on('connection', (socket) => {
  socket.emit('welcome', {
    socketId: socket.id,
    playerRoom: Game.addPlayer(socket.id),
    ...(Game.gameStatus === GAME_STATUS.PLAYING && {
      startTime: Game.startTime,
      gameDuration: Game.gameDuration,
    }),
  });

  socket.on('disconnect', () => {
    Game.deletePlayer(socket.id);
  });

  socket.on('client_playerReady', () => {
    Game.updateReadyPlayer(socket.id);
    if (Game.readyToStart) {
      Game.startGame();
      setTimeout(() => {
        io.emit('server_gameOver');
        Game.startPregame();
      }, Game.gameDuration);
      io.emit('server_gameStarted', {
        players: Array.from(Game.players.get('game').entries()),
        startTime: Game.startTime,
        gameDuration: Game.gameDuration,
      });
    } else {
      io.emit('server_pregameRoomUpdate', Array.from(Game.players.get('pregame').values()));
    }
  });

  socket.on('client_playAgain', () => {
    socket.emit('server_playAgainGranted');
  });

  socket.on('client_movementUpdate', ({
    velX, velY, flip, anim,
  }) => {
    socket.broadcast.emit('server_movementUpdate', {
      velX, velY, flip, anim, socketId: socket.id,
    });
  });

  socket.on('client_positionUpdate', ({ x, y }) => {
    socket.broadcast.emit('server_positionUpdate', { x, y, socketId: socket.id });
  });
});
