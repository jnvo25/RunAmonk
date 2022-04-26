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

    // Display WaitingRoom
    this.scene.add('WaitingStage', WaitingStage);
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
      this.scene.add('WaitingStage', WaitingStage);
      this.scene.bringToTop('WaitingStage');
      this.scene.launch('WaitingStage');
    });

    this.socket.on('server_gameStarted', (startData) => {
      this.scene.remove('WaitingStage');
      this.registry.set('gameRoomOccupants', startData.players);
      this.registry.set('startTime', startData.startTime);
      this.registry.set('gameDuration', startData.gameDuration);
      this.scene.add('GameStage', GameStage);
      this.scene.bringToTop('GameStage');
      this.scene.launch('GameStage');
    });

    this.socket.on('server_gameOver', () => {
      this.scene.add('PostgameStage', PostgameStage);
      this.scene.remove('GameStage');
      this.scene.bringToTop('PostgameStage');
      this.scene.launch('PostgameStage');
    });
  }
}
