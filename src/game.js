import Player from './player';

export default class Game {
  constructor() {
    this.players = new Map([
      ['waiting', new Map()],
      ['pregame', new Map()],
      ['game', new Map()],
    ]);
  }

  addPlayer(socketId) {
    this.players.get('waiting').set(socketId, new Player());
  }

  getPlayerStatus(socketId) {
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
    this.players.get(this.getPlayerStatus(socketId)).delete(socketId);
  }

  movePlayer(socketId, status) {
    // Get player information
    const playerState = this.getPlayerStatus(socketId);
    const tempPlayer = this.players.get(playerState).get(socketId);

    // Copy to new and delete original
    this.players.get(status).set(socketId, tempPlayer);
    this.players.get(playerState).delete(socketId);
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
}
