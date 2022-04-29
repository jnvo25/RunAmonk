// eslint-disable-next-line import/extensions
import helpers from './helpers.js';

const { getTime } = helpers;

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
    this.cursors = this.registry.get('cursors');

    // Create player
    this.data.set('playerSprite', this.createPlayer(200, 200, 'monkee'));

    // Create other players
    const iterator = this.registry.get('gameRoomOccupants').entries();
    const otherPlayers = new Map();
    let iteratorResult = iterator.next();
    while (!iteratorResult.done) {
      const playerData = iteratorResult.value[1];
      otherPlayers.set(iteratorResult.value[0], this.createPlayer(playerData.position.x, playerData.position.y, 'monkee'));
      iteratorResult = iterator.next();
    }
    this.data.set('otherPlayers', otherPlayers);

    // Create timer
    this.timer = this.add.text(738, 35, (this.registry.get('gameDuration') - Date.now() - this.registry.get('startTime')), { backgroundColor: '#ffo', fontSize: '40px' }).setOrigin(0.5);
    // console.log(this.registry.get('gameRoomOccupants'));
  }

  update() {
    this.readPlayerInput();
    this.timer.setText(getTime(this.registry.get('startTime'), this.registry.get('gameDuration')));
  }

  readPlayerInput() {
    const playerSprite = this.data.get('playerSprite');
    if (this.cursors.up.isDown) {
      if (playerSprite.body.onFloor()) {
        playerSprite.setVelocityY(-400);
      }
    }
    if (this.cursors.left.isDown) {
      playerSprite.setVelocityX(-160);
      playerSprite.setFlipX(true);
      playerSprite.anims.play(`${playerSprite.character}-run`, true);
    } else if (this.cursors.right.isDown) {
      playerSprite.setVelocityX(160);
      playerSprite.setFlipX(false);
      playerSprite.anims.play(`${playerSprite.character}-run`, true);
    } else {
      playerSprite.setVelocityX(0);
      playerSprite.anims.play(`${playerSprite.character}-idle`, true);
    }

    const playerPosition = {
      x: playerSprite.x,
      y: playerSprite.y,
      velX: playerSprite.body.velocity.x,
      velY: playerSprite.body.velocity.y,
      // flip: playerSprite.flipX,
      // anim: playerSprite.anims.getName(),
    };
    if (!this.data.get('playerPosition')
      || playerSprite.body.velocity.x !== this.data.get('playerPosition').velX
      || playerSprite.body.velocity.y !== this.data.get('playerPosition').velY) {
      this.registry.get('socket').emit('client_movementUpdate', {
        velX: playerSprite.body.velocity.x,
        velY: playerSprite.body.velocity.y,
      });
      this.data.set('playerPosition', playerPosition);
    } else if (!this.data.get('positionLastUpdated') || Date.now() - this.data.get('positionLastUpdated') > 500) {
      this.registry.get('socket').emit('client_positionUpdate', {
        x: playerPosition.x,
        y: playerPosition.y,
      });
    }
  }

  createPlayer(positionX, positionY, character) {
    const tempPlayerSprite = this.physics.add.sprite(positionX, positionY, `${character}-idle`);

    // Character data
    tempPlayerSprite.anims.play(`${character}-idle`, true);
    tempPlayerSprite.id = this.registry.get('socketId');
    tempPlayerSprite.character = character;
    this.registry.get((character === 'monkee') ? 'monkeeGroup' : 'runnerGroup').add(tempPlayerSprite);

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

    this.socket.on('server_movementUpdate', ({ velX, velY, socketId }) => {
      const movedPlayerSprite = this.data.get('otherPlayers').get(socketId);
      movedPlayerSprite.setVelocityX(velX);
      movedPlayerSprite.setVelocityY(velY);
    });

    this.socket.on('server_positionUpdate', ({ x, y, socketId }) => {
      const movedPlayerSprite = this.data.get('otherPlayers').get(socketId);
      movedPlayerSprite.setPosition(x, y);
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
