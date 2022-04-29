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
        this.launchScene(SCENES.WaitingStage);
      } else {
        this.launchScene(SCENES.PregameStage);
      }
    });

    this.socket.on('server_playAgainGranted', () => {
      this.launchScene(SCENES.PregameStage);
    });

    this.socket.on('server_gameStarted', (startData) => {
      const gameRoomOccupants = new Map();
      startData.players.forEach((player) => {
        if (player[0] !== this.registry.get('socketId')) gameRoomOccupants.set(player[0], player[1]);
      });
      this.registry.set('gameRoomOccupants', gameRoomOccupants);
      this.registry.set('startTime', startData.startTime);
      this.registry.set('gameDuration', startData.gameDuration);
      this.launchScene(SCENES.GameStage);
    });

    this.socket.on('server_gameOver', () => {
      this.launchScene(SCENES.PostgameStage);
    });
  }

  launchScene(scene) {
    this.scene.manager.getScenes(true, true).forEach((e) => {
      const elementName = e.scene.key.toString();
      if (elementName !== 'MainStage') {
        this.scene.sleep(elementName);
      }
    });
    if (this.scene.isSleeping(scene.name) === null) {
      this.scene.add(scene.name, scene);
      this.scene.bringToTop(scene.name);
      this.scene.launch(scene.name);
    } else {
      this.scene.wake(scene.name);
    }
    // if (this.scene.get(scene.name) === undefined) this.scene.add(scene.name, scene);
  }
}
