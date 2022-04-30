module.exports = class Player {
  constructor() {
    this.character = undefined;
    this.isReady = false;
    this.isTagged = false;
    this.position = undefined;
    this.specialMoveCooldown = undefined;
  }

  reset() {
    this.character = undefined;
    this.isReady = false;
    this.isTagged = false;
    this.position = undefined;
    this.specialMoveCooldown = undefined;
  }
};
