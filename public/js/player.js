module.exports = class Player {
  constructor() {
    this.character = undefined;
    this.isReady = false;
    this.isTagged = false;
  }

  reset() {
    this.character = undefined;
    this.isReady = false;
    this.isTagged = false;
  }
};
