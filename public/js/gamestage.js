// eslint-disable-next-line no-undef
export default class GameStage extends Phaser.Scene {
  constructor() {
    super('GameStage');
  }

  preload() {
    // Load  Monkee assets
    this.load.spritesheet('monkee-idle', 'assets/Monkee_Monster/Monkee_Monster_Idle_18.png', { frameWidth: 32, frameHeight: 32 });
    this.load.spritesheet('monkee-run', 'assets/Monkee_Monster/Monkee_Monster_Run_8.png', { frameWidth: 32, frameHeight: 32 });

    // Load stage assets
    this.load.image('background', 'assets/maps/images/background.png');
    this.load.image('spike', 'assets/maps/images/spike.png');
    this.load.image('tiles', 'assets/maps/tilesets/terrain_tilesheet.png');
    this.load.tilemapTiledJSON('map', 'assets/maps/tilemaps/homestage.json');
  }

  create() {
    // Create stage
    const backgroundImage = this.add.image(0, 0, 'background').setOrigin(0, 0);
    backgroundImage.setScale(2, 0.8);
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('terrain_tilesheet', 'tiles');
    this.platforms = map.createStaticLayer('Platforms', tileset, 0, 0);
    this.platforms.setCollisionByExclusion(-1, true);

    // Create animations
    this.createAnimation('monkee-idle', 17, true);
    this.createAnimation('monkee-run', 7, true);

    // Setup communications with server
    this.socket = this.registry.get('socket');
    this.setupSockets();

    // Get variables ready
    this.registry.set('monkeeGroup', this.add.group());
    this.registry.set('runnerGroup', this.add.group());

    // Create player
    const tempPlayerSprite = this.createPlayer(200, 200, 'monkee', 'asdfasdf');
    
    // console.log(this.registry.get('gameRoomOccupants'));
  }

  // TODO: Get player input

  createPlayer(positionX, positionY, character, id) {
    const tempPlayerSprite = this.physics.add.sprite(positionX, positionY, `${character}-idle`);

    // Character data
    tempPlayerSprite.anims.play(`${character}-idle`, true);
    tempPlayerSprite.id = id;
    tempPlayerSprite.character = character;
    tempPlayerSprite.isTagged = false;
    if (character === 'monkee') {
      this.registry.get('monkeeGroup').add(tempPlayerSprite);
    } else {
      this.registry.get('runnerGroup').add(tempPlayerSprite);
    }

    // Character appearance
    tempPlayerSprite.setSize(14, 27);
    tempPlayerSprite.setOffset(8, 5);

    // Character physics
    tempPlayerSprite.setCollideWorldBounds(true);
    this.physics.add.collider(tempPlayerSprite, this.platforms);

    return tempPlayerSprite;
  }

  setupSockets() {
    this.socket.on('server_playerUpdate', (gameRoomOccupants) => {
      console.log('Server sent player update', gameRoomOccupants);
    });
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
