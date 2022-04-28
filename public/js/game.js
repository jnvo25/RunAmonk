const Player = require('./player');
const { GAME_STATUS, GAME_DURATION, GAME_ROOMS } = require('./config');

module.exports = class Game {
  constructor() {
    this.players = new Map(Array.from(Object.values(GAME_ROOMS)).map((room) => [room, new Map()]));
    this.startTime = undefined;
    this.gameDuration = GAME_DURATION;
  }

  addPlayer(socketId) {
    Game.verifyValidSocketId(socketId);

    // Calculate room to put player and place them there
    const roomToPlace = (this.gameStatus === GAME_STATUS.PLAYING)
      ? GAME_ROOMS.WAITING : GAME_ROOMS.PREGAME;
    this.players.get(roomToPlace).set(socketId, new Player());
    return roomToPlace;
  }

  startGame() {
    if (!this.readyToStart) throw new Error('Game is not ready to start');
    if (this.startTime !== undefined) throw new Error('Error starting game, start time exists');

    // Move all players from pregame to game state
    const iterator = this.players.get(GAME_ROOMS.PREGAME).keys();
    let iteratorResult = iterator.next();
    while (!iteratorResult.done) {
      this.movePlayer(iteratorResult.value, GAME_ROOMS.GAME);
      iteratorResult = iterator.next();
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

    // Iterate through maps and return room containing socketId
    const iterator = this.players.entries();
    let iteratorResult = iterator.next();
    while (!iteratorResult.done) {
      if (iteratorResult.value[1].has(socketId)) return iteratorResult.value[0];
      iteratorResult = iterator.next();
    }

    throw new Error(`Unable to find player with socketId: ${socketId}`);
  }

  getPlayer(socketId, roomName = undefined) {
    if (roomName) return this.players.get(roomName).get(socketId);
    return this.players.get(this.getPlayerRoom(socketId)).get(socketId);
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
    if (!this.players.get(GAME_ROOMS.PREGAME).has(socketId)) throw new Error(`There is no player with socketId, ${socketId}, in the pregame map`);

    this.getPlayer(socketId, GAME_ROOMS.PREGAME).isReady = true;
  }

  startPregame() {
    // Get players from waiting and game rooms
    const waitingPlayerIds = Array.from(this.players.get(GAME_ROOMS.WAITING).keys());
    const gamePlayerIds = Array.from(this.players.get(GAME_ROOMS.GAME).keys());

    // Combine rooms and move players to pregame
    waitingPlayerIds.concat(gamePlayerIds).forEach((socketId) => {
      this.movePlayer(socketId, GAME_ROOMS.PREGAME);
      this.getPlayer(socketId, GAME_ROOMS.PREGAME).reset();
    });

    this.startTime = undefined;
  }

  get readyToStart() {
    if (this.startTime !== undefined) return false;

    // Check if all players in pregame room are ready
    const iterator = this.players.get(GAME_ROOMS.PREGAME).values();
    let iteratorResult = iterator.next();
    while (!iteratorResult.done) {
      if (!iteratorResult.value.isReady) return false;
      iteratorResult = iterator.next();
    }

    // TODO: Make sure there are more than 1 ready player
    return true;
  }

  get waitingPlayers() {
    return this.players.get(GAME_ROOMS.WAITING).keys();
  }

  get pregamePlayers() {
    return this.players.get(GAME_ROOMS.PREGAME).keys();
  }

  get gamePlayers() {
    return this.players.get(GAME_ROOMS.GAME).keys();
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
    if (!Object.values(GAME_ROOMS).includes(room)) throw new Error(`Invalid room: ${room}`);
  }
};
