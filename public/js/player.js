export default class Player {
  constructor() {
    this.character = undefined;
    this.isReady = false;
    this.isTagged = false;
  }

  reset() {
    this.isReady = false;
    this.isTagged = false;
    this.character = undefined;
  }
}
