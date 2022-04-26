const Player = require('./player');

module.exports = class Game {
  constructor() {
    this.players = new Map([
      ['waiting', new Map()],
      ['pregame', new Map()],
      ['game', new Map()],
    ]);
  }

  addPlayer(socketId) {
    Game.verifyValidSocketId(socketId);

    this.players.get('pregame').set(socketId, new Player());
  }

  startGame() {
    if (!this.readyToStart) throw new Error('Game is not ready to start');

    // Move all players from pregame to game state
    const iterator = this.players.get('pregame').keys();
    let value = iterator.next();
    while (!value.done) {
      this.movePlayer(value.value, 'game');
      value = iterator.next();
    }
  }

  getPlayerStatus(socketId) {
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
    this.players.get(this.getPlayerStatus(socketId)).delete(socketId);
  }

  movePlayer(socketId, status) {
    Game.verifyValidSocketId(socketId);
    Game.verifyValidStatus(status);

    // Get player information
    const playerState = this.getPlayerStatus(socketId);
    const tempPlayer = this.players.get(playerState).get(socketId);

    // Copy to new and delete original
    this.players.get(status).set(socketId, tempPlayer);
    this.players.get(playerState).delete(socketId);
  }

  updateReadyPlayer(socketId) {
    Game.verifyValidSocketId(socketId);

    // Get waiting player object and set isReady property
    if (!this.players.get('pregame').has(socketId)) throw new Error(`There is no player with socketId, ${socketId}, in the pregame map`);
    this.players.get('pregame').get(socketId).isReady = true;
  }

  get readyToStart() {
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

  static verifyValidSocketId(socketId) {
    if (socketId.length !== 20) throw new Error(`Invalid socket id: ${socketId}`);
  }

  static verifyValidStatus(status) {
    if (!Array.from(this.players.keys()).has(status)) throw new Error(`Invalid status: ${status}`);
  }
};
