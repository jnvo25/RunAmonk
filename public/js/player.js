module.exports = class Player {
  constructor() {
    this.character = undefined;
    this.isReady = false;
    this.isTagged = false;
    this.isChaser = false;
    this.speed = false;
    this.position = undefined;
    this.specialMoveCooldown = undefined;
  }

  reset() {
    this.character = undefined;
    this.isReady = false;
    this.isTagged = false;
    this.isChaser = false;
    this.speed = false;
    this.position = undefined;
    this.specialMoveCooldown = undefined;
  }
};
