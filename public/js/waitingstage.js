// eslint-disable-next-line no-undef
export default class WaitingStage extends Phaser.Scene {
  constructor() {
    super('WaitingStage');
  }

  create() {
    this.add.text(400, 400, 'Hello World!', {});
  }
}
