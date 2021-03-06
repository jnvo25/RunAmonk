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
    ...(Game.gameStatus === GAME_STATUS.IDLE && {
      pregameOccupants: Array.from(Game.players.get('pregame').values()),
    }),
    // Send start time and duration if game is in progress
    ...(Game.gameStatus === GAME_STATUS.PLAYING && {
      startTime: Game.startTime,
      gameDuration: Game.gameDuration,
    }),
  });

  socket.on('disconnect', () => {
    Game.deletePlayer(socket.id);

    // TODO: Emit to users that player has disconnected
  });

  socket.on('client_playerReady', () => {
    Game.updateReadyPlayer(socket.id);
    if (Game.readyToStart) {
      Game.startGame(() => {
        setTimeout(() => {
          io.emit('server_gameOver');
          Game.startPregame();
        }, 2000);
      });
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
    io.emit('server_pregameRoomUpdate', Array.from(Game.players.get('pregame').values()));
  });

  socket.on('client_movementUpdate', ({
    velX, velY, flip, anim,
  }) => {
    if (Game.gameStatus === GAME_STATUS.PLAYING && !Game.isPlayerTagged(socket.id)) {
      socket.broadcast.emit('server_movementUpdate', {
        velX, velY, flip, anim, socketId: socket.id,
      });
    }
  });

  socket.on('client_changeCharacter', () => {
    io.emit('server_changeCharacter', { socketId: socket.id, character: 'piggee-special' });
  });

  socket.on('client_specialMove', (position) => {
    if (Game.gameStatus === GAME_STATUS.PLAYING) {
      io.emit('server_specialMoveGranted', { position, socketId: socket.id });
    }
  });

  socket.on('client_positionUpdate', ({ x, y }) => {
    if (Game.gameStatus === GAME_STATUS.PLAYING && !Game.isPlayerTagged(socket.id)) socket.broadcast.emit('server_positionUpdate', { x, y, socketId: socket.id });
  });

  socket.on('client_tagged', () => {
    if (Game.updatePlayerTagged(socket.id)) io.emit('server_tagUpdate', socket.id);
    Game.checkAllPlayersTagged();
  });

  socket.on('client_slowed', () => {
    // const {duration, speed} = Game.updatePlayerSlowed(socket.id);
    socket.emit('server_speedUpdate', { duration: 5000, speed: 80 });
  });
});
