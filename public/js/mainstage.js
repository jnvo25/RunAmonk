/* eslint-disable import/extensions */
import WaitingStage from './waitingstage.js';
import GameStage from './gamestage.js';

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
    this.setupSockets();

    this.scene.add('WaitingStage', WaitingStage);
    this.scene.add('GameStage', GameStage);
    this.scene.bringToTop('WaitingStage');
    this.scene.launch('WaitingStage');
  }

  setupSockets() {
    this.socket.on('welcome', (socketId) => {
      this.registry.set('socketId', socketId);
    });

    this.socket.on('server_gameStarted', (gameRoomOccupants) => {
      this.scene.remove('WaitingStage');
      this.registry.set('gameRoomOccupants', gameRoomOccupants);
      this.scene.bringToTop('GameStage');
      this.scene.launch('GameStage');
    });
  }
}
