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

  preload() {
    this.load.plugin('PhaserSceneWatcherPlugin', 'https://cdn.jsdelivr.net/npm/phaser-plugin-scene-watcher@6.0.0/dist/phaser-plugin-scene-watcher.umd.js', true);

    // Load assets
    // Load  Monkee assets
    this.load.spritesheet('monkee-idle', 'assets/Monkee_Monster/Monkee_Monster_Idle_18.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('monkee-run', 'assets/Monkee_Monster/Monkee_Monster_Run_8.png', { frameWidth: 32, frameHeight: 32 });

    // Load  Piggee assets
    this.load.spritesheet('piggee-idle', 'assets/Piggee_Monster/Piggee_Monster_Idle_11.png', { frameWidth: 34, frameHeight: 28 });
    this.load.spritesheet('piggee-run', 'assets/Piggee_Monster/Piggee_Monster_Run_6.png', { frameWidth: 34, frameHeight: 28 });
    this.load.spritesheet('piggee-special-idle', 'assets/Piggee_Monster/Piggee_Monster_Special_Idle_9.png', { frameWidth: 26, frameHeight: 30 });
    this.load.spritesheet('piggee-special-run', 'assets/Piggee_Monster/Piggee_Monster_Special_Run_6.png', { frameWidth: 26, frameHeight: 30 });
    this.load.image('piggee-box', 'assets/Piggee_Monster/Piggee_Monster_Box.png');

    // Load Pinkie assets
    this.load.spritesheet('pinkie-idle', 'assets/Pink_Monster/Pink_Monster_Idle_4.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('pinkie-run', 'assets/Pink_Monster/Pink_Monster_Run_6.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('pinkie-death', 'assets/Pink_Monster/Pink_Monster_Death_8.png', { frameWidth: 32, frameHeight: 32 });

    // Load Owlet assets
    this.load.spritesheet('owlet-idle', 'assets/Owlet_Monster/Owlet_Monster_Idle_4.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('owlet-run', 'assets/Owlet_Monster/Owlet_Monster_Run_6.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('owlet-jump', 'assets/Owlet_Monster/Owlet_Monster_Jump_8.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('owlet-death', 'assets/Owlet_Monster/Owlet_Monster_Death_8.png', { frameWidth: 32, frameHeight: 32 });

    // Load audio
    this.load.audio('jump', 'assets/Sounds/jump.mp3');
    this.load.audio('background', 'assets/Sounds/background.mp3');
    this.load.audio('grunt', 'assets/Sounds/grunt.mp3');
    this.load.audio('punch', 'assets/Sounds/punch.mp3');
    this.load.audio('small-punch', 'assets/Sounds/small-punch.wav');
    this.load.audio('crate-break', 'assets/Sounds/crate-break.wav');

    // Load stage assets
    this.load.image('background', 'assets/maps/images/background.png');
    this.load.image('spike', 'assets/maps/images/spike.png');
    this.load.image('tiles', 'assets/maps/tilesets/terrain_tilesheet.png');
    this.load.tilemapTiledJSON('map', 'assets/maps/tilemaps/homestage.json');
  }

  create() {
    // Setup connections for socket.io
    // eslint-disable-next-line no-undef
    this.registry.set('socket', io());
    this.socket = this.registry.get('socket');
    this.setupSockets();

    // Setup registry data
    this.registry.set('cursors', this.input.keyboard.createCursorKeys());
    // eslint-disable-next-line no-undef
    this.registry.set('spacebar', this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE));
    this.registry.set('screenCenterX', this.cameras.main.worldView.x + this.cameras.main.width / 2);
    this.registry.set('screenCenterY', this.cameras.main.worldView.y + this.cameras.main.height / 2);
    this.registry.set('firstRun', true);

    // Generate Assets
    // Create stage
    const backgroundImage = this.add.image(0, 0, 'background').setOrigin(0, 0);
    backgroundImage.setScale(2, 0.8);
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('terrain_tilesheet', 'tiles');
    this.registry.set('platforms', map.createStaticLayer('Platforms', tileset, 0, 0));
    this.registry.get('platforms').setCollisionByExclusion(-1, true);

    // Create animations
    this.createAnimation('owlet-idle', 3, true);
    this.createAnimation('owlet-run', 5, true);
    this.createAnimation('owlet-death', 7, false);

    this.createAnimation('pinkie-idle', 3, true);
    this.createAnimation('pinkie-run', 5, true);
    this.createAnimation('pinkie-death', 7, false);

    this.createAnimation('monkee-idle', 17, true);
    this.createAnimation('monkee-run', 7, true);

    this.createAnimation('piggee-idle', 10, true);
    this.createAnimation('piggee-run', 5, true);
    this.createAnimation('piggee-special-idle', 8, true);
    this.createAnimation('piggee-special-run', 5, true);

    // Create sounds
    this.sound.add('jump', { volume: 0.3, detune: 400 });
    this.sound.add('background', { volume: 0.2, detune: 200 });
    this.sound.add('punch', { volume: 0.2 });
    this.sound.add('grunt', { volume: 0.2, detune: 400 });
    this.sound.add('small-punch', { volume: 0.2, detune: 400 });
    this.sound.add('crate-break', { volume: 0.8 });
  }

  setupSockets() {
    this.socket.on('welcome', (welcomeInfo) => {
      this.registry.set('socketId', welcomeInfo.socketId);
      if (welcomeInfo.playerRoom === 'waiting') {
        this.registry.set('startTime', welcomeInfo.startTime);
        this.registry.set('gameDuration', welcomeInfo.gameDuration);
        this.launchScene(SCENES.WaitingStage);
      } else {
        this.registry.set('pregameOccupants', welcomeInfo.pregameOccupants);
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
        else this.registry.set('playerData', player[1]);
      });
      this.registry.set('gameRoomOccupants', gameRoomOccupants);
      this.registry.set('startTime', startData.startTime);
      this.registry.set('gameDuration', startData.gameDuration);
      this.launchScene(SCENES.GameStage);
    });

    this.socket.on('server_gameOver', () => {
      this.game.sound.stopAll();
      this.registry.set('firstRun', false);
      this.launchScene(SCENES.PostgameStage);
    });
  }

  launchScene(scene) {
    this.scene.manager.getScenes(true, true).forEach((e) => {
      const elementName = e.scene.key.toString();
      if (elementName !== 'MainStage') {
        this.scene.stop(elementName);
      }
    });
    if (this.scene.isSleeping(scene.name) === null) {
      this.scene.add(scene.name, scene);
      this.scene.bringToTop(scene.name);
      this.scene.launch(scene.name);
    } else {
      this.scene.launch(scene.name);
    }
  }

  // Add animation to phaser
  createAnimation(name, frames, repeat) {
    const config = {
      key: name,
      frames: this.anims.generateFrameNumbers(name, { start: 0, end: frames }),
      frameRate: 10,
    };
    if (repeat) {
      config.repeat = -1;
    }
    this.anims.create(config);
  }
}
