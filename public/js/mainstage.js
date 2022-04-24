/* eslint-disable import/extensions */
import WaitingStage from './waitingstage.js';
import GameStage from './gamestage.js';
import PostgameStage from './postgamestage.js';

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

    // Load stages
    this.scene.add('WaitingStage', WaitingStage);
    this.scene.add('GameStage', GameStage);
    this.scene.add('PostgameStage', PostgameStage);

    // Display WaitingRoom
    this.scene.bringToTop('WaitingStage');
    this.scene.launch('WaitingStage');

    // Setup registry data
    this.registry.set('cursors', this.input.keyboard.createCursorKeys());
    this.registry.set('screenCenterX', this.cameras.main.worldView.x + this.cameras.main.width / 2);
    this.registry.set('screenCenterY', this.cameras.main.worldView.y + this.cameras.main.height / 2);
  }

  setupSockets() {
    this.socket.on('welcome', (socketId) => {
      this.registry.set('socketId', socketId);
    });

    this.socket.on('server_playAgainGranted', () => {
      this.scene.remove('PostgameStage');
      this.scene.bringToTop('WaitingStage');
      this.scene.launch('WaitingStage');
    });

    this.socket.on('server_gameStarted', (gameRoomOccupants) => {
      this.scene.remove('WaitingStage');
      this.registry.set('gameRoomOccupants', gameRoomOccupants);
      this.scene.bringToTop('GameStage');
      this.scene.launch('GameStage');
    });
  }
}
