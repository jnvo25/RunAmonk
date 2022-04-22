export default class Player {
  constructor(socketId) {
    if (socketId.length !== 20) { throw new Error('Parameter (socketId) not a 20 char string'); }

    this.character = undefined;
    this.socketId = socketId;
    this.isReady = false;
    this.isTagged = false;
  }

  reset() {
    this.isReady = false;
    this.isTagged = false;
    this.character = undefined;
  }
}
