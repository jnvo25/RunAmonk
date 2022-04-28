/* eslint-disable import/extensions */
import PregameStage from './pregamestage.js';
import GameStage from './gamestage.js';
import PostgameStage from './postgamestage.js';
import WaitingStage from './waitingstage.js';

const SCENES = {
  PregameStage,
  GameStage,
  PostgameStage,
  WaitingStage,
};

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

    // Setup registry data
    this.registry.set('cursors', this.input.keyboard.createCursorKeys());
    this.registry.set('screenCenterX', this.cameras.main.worldView.x + this.cameras.main.width / 2);
    this.registry.set('screenCenterY', this.cameras.main.worldView.y + this.cameras.main.height / 2);
  }

  setupSockets() {
    this.socket.on('welcome', (welcomeInfo) => {
      this.registry.set('socketId', welcomeInfo.socketId);
      if (welcomeInfo.playerRoom === 'waiting') {
        this.registry.set('startTime', welcomeInfo.startTime);
        this.registry.set('gameDuration', welcomeInfo.gameDuration);
        this.launchNewScene(SCENES.WaitingStage);
      } else {
        this.launchNewScene(SCENES.PregameStage);
      }
    });

    this.socket.on('server_playAgainGranted', () => {
      this.launchNewScene(SCENES.PregameStage);
    });

    this.socket.on('server_gameStarted', (startData) => {
      this.registry.set('gameRoomOccupants', startData.players);
      this.registry.set('startTime', startData.startTime);
      this.registry.set('gameDuration', startData.gameDuration);
      this.launchNewScene(SCENES.GameStage);
    });

    this.socket.on('server_gameOver', () => {
      this.launchNewScene(SCENES.PostgameStage);
    });
  }

  launchNewScene(scene) {
    this.scene.manager.getScenes(true, true).forEach((e) => {
      const elementName = e.scene.key.toString();
      if (elementName !== 'MainStage') {
        this.scene.remove(elementName);
      }
    });
    this.scene.add(scene.name, scene);
    this.scene.bringToTop(scene.name);
    this.scene.launch(scene.name);
  }
}
