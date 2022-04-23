// eslint-disable-next-line import/extensions
import WaitingStage from './waitingstage.js';

// eslint-disable-next-line no-undef
export default class MainStage extends Phaser.Scene {
  constructor() {
    super('MainStage');
  }

  create() {
    // Setup connections for socket.io
    // eslint-disable-next-line no-undef
    this.registry.set('socket', io());
    this.socket = this.registry.get('socket');

    this.scene.add('WaitingStage', WaitingStage);
    this.scene.bringToTop('WaitingStage');
    this.scene.launch('WaitingStage');
  }
}
