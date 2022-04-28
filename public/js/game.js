const Player = require('./player');
const { GAME_STATUS, GAME_DURATION, GAME_ROOMS } = require('./config');

module.exports = class Game {
  constructor() {
    this.players = new Map(GAME_ROOMS.map((room) => [room, new Map()]));
    this.startTime = undefined;
    this.gameDuration = GAME_DURATION;
  }

  addPlayer(socketId) {
    Game.verifyValidSocketId(socketId);
    const roomToPlace = (this.gameStatus === GAME_STATUS.PLAYING) ? 'waiting' : 'pregame';
    this.players.get(roomToPlace).set(socketId, new Player());
    return roomToPlace;
  }

  startGame() {
    if (!this.readyToStart) throw new Error('Game is not ready to start');
    if (this.startTime !== undefined) throw new Error('Error starting game, start time exists');

    // Move all players from pregame to game state
    const iterator = this.players.get('pregame').keys();
    let value = iterator.next();
    while (!value.done) {
      this.movePlayer(value.value, 'game');
      value = iterator.next();
    }

    // Start timer
    this.startTime = Date.now();
  }

  isGameOver() {
    if (this.startTime === undefined) throw new Error('Game has not started yet');
    return (Date.now() - this.startTime >= this.gameDuration);
  }

  getPlayerRoom(socketId) {
    Game.verifyValidSocketId(socketId);

    // Get all state maps and iterate
    const iterator = this.players.entries();
    let value = iterator.next();
    while (!value.done) {
      if (value.value[1].has(socketId)) return value.value[0];
      value = iterator.next();
    }
    throw new Error(`Unable to find player with socketId: ${socketId}`);
  }

  deletePlayer(socketId) {
    Game.verifyValidSocketId(socketId);
    this.players.get(this.getPlayerRoom(socketId)).delete(socketId);
  }

  movePlayer(socketId, room) {
    Game.verifyValidSocketId(socketId);
    Game.verifyValidRoom(room);

    // Get player information
    const playerState = this.getPlayerRoom(socketId);
    const tempPlayer = this.players.get(playerState).get(socketId);

    // Copy to new and delete original
    this.players.get(room).set(socketId, tempPlayer);
    this.players.get(playerState).delete(socketId);
  }

  updateReadyPlayer(socketId) {
    Game.verifyValidSocketId(socketId);

    // Get waiting player object and set isReady property
    if (!this.players.get('pregame').has(socketId)) throw new Error(`There is no player with socketId, ${socketId}, in the pregame map`);
    this.players.get('pregame').get(socketId).isReady = true;
  }

  startPregame() {
    // Move all players from waiting and game room to pregame room
    const waitingPlayerIds = Array.from(this.players.get('waiting').keys());
    const gamePlayerIds = Array.from(this.players.get('game').keys());
    waitingPlayerIds.concat(gamePlayerIds).forEach((id) => {
      this.movePlayer(id, 'pregame');
      this.players.get('pregame').get(id).isReady = false;
    });

    this.startTime = undefined;
  }

  get readyToStart() {
    if (this.startTime !== undefined) return false;

    const iterator = this.players.get('pregame').values();
    let value = iterator.next();
    while (!value.done) {
      if (!value.value.isReady) return false;
      value = iterator.next();
    }
    // TODO: Make sure there are more than 1 ready player
    return true;
  }

  get waitingPlayers() {
    return this.players.get('waiting').keys();
  }

  get pregamePlayers() {
    return this.players.get('pregame').keys();
  }

  get gamePlayers() {
    return this.players.get('game').keys();
  }

  get gameStatus() {
    // If there is a start time, game is in session
    if (this.startTime && Date.now() - this.startTime < this.gameDuration) {
      return GAME_STATUS.PLAYING;
    }
    return GAME_STATUS.IDLE;
  }

  static verifyValidSocketId(socketId) {
    if (socketId.length !== 20) throw new Error(`Invalid socket id: ${socketId}`);
  }

  static verifyValidRoom(room) {
    if (GAME_ROOMS.indexOf(room) === -1) throw new Error(`Invalid room: ${room}`);
  }
};
