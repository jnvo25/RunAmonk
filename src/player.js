export default class Player {
  constructor(socketId) {
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
