function getTime(startTime, gameDuration) {
  return Math.floor((gameDuration / 1000) - (Date.now() - startTime) / 1000);
}

// eslint-disable-next-line no-undef
export default class GameStage extends Phaser.Scene {
  constructor() {
    super('GameStage');
  }

  preload() {
    // this.load.setPath('assets/audio/tech');
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
    this.jump = this.sound.add('jump', { volume: 0.3, detune: 400 });
    this.background = this.sound.add('background', { volume: 0.2, detune: 200 });
    this.background.play();
    this.punch = this.sound.add('punch', { volume: 0.2 });
    this.grunt = this.sound.add('grunt', { volume: 0.2, detune: 400 });

    // Setup communications with server
    this.socket = this.registry.get('socket');
    this.setupSockets();

    // Get variables ready
    this.registry.set('chaserGroup', this.add.group());
    this.registry.set('runnerGroup', this.add.group());
    this.cursors = this.registry.get('cursors');

    // Handle overlap tag
    this.physics.add.overlap(this.registry.get('runnerGroup'), this.registry.get('chaserGroup'), (player1, player2) => {
      if (!player1.isChaser) this.registry.get('runnerGroup').remove(player1);
      if (!player2.isChaser) this.registry.get('runnerGroup').remove(player2);
      if (!this.data.get('playerSprite').isChaser) {
        this.registry.get('socket').emit('client_tagged');
      }
    });

    // Create player
    const playerData = this.registry.get('playerData');
    this.data.set('playerSprite', this.createPlayer(playerData.position.x, playerData.position.y, playerData.character, playerData.isChaser));

    // Create other players
    const iterator = this.registry.get('gameRoomOccupants').entries();
    const otherPlayers = new Map();
    let iteratorData = iterator.next();
    while (!iteratorData.done) {
      const { position, character, isChaser } = iteratorData.value[1];
      otherPlayers.set(iteratorData.value[0], this.createPlayer(position.x, position.y, character, isChaser));
      iteratorData = iterator.next();
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
    if (this.registry.get('spacebar').isDown) {
      this.registry.get('socket').emit('client_specialMove');
    }
    if (this.data.get('playerSprite').isTagged) return;

    if (this.cursors.up.isDown) {
      if (playerSprite.body.onFloor()) {
        this.jump.play();
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
    };
    if (!this.data.get('playerPosition')
      || playerSprite.body.velocity.x !== this.data.get('playerPosition').velX
      || playerSprite.body.velocity.y !== this.data.get('playerPosition').velY) {
      this.registry.get('socket').emit('client_movementUpdate', {
        velX: playerSprite.body.velocity.x,
        velY: playerSprite.body.velocity.y,
        flip: playerSprite.flipX,
        anim: playerSprite.anims.getName(),
      });
      this.data.set('playerPosition', playerPosition);
    }
    if (!this.data.get('positionLastUpdated') || Date.now() - this.data.get('positionLastUpdated') > 500) {
      this.registry.get('socket').emit('client_positionUpdate', {
        x: playerPosition.x,
        y: playerPosition.y,
      });
    }
  }

  createPlayer(positionX, positionY, character, isChaser) {
    const tempPlayerSprite = this.physics.add.sprite(positionX, positionY, `${character}-idle`);

    // Character data
    tempPlayerSprite.anims.play(`${character}-idle`, true);
    tempPlayerSprite.id = this.registry.get('socketId');
    tempPlayerSprite.character = character;
    tempPlayerSprite.isChaser = isChaser;
    this.registry.get((isChaser) ? 'chaserGroup' : 'runnerGroup').add(tempPlayerSprite);

    // Character appearance
    if (tempPlayerSprite.character === 'piggee') {
      tempPlayerSprite.setScale(1.7);
      tempPlayerSprite.setSize(14, 13);
      tempPlayerSprite.setOffset(9, 14);
    } else {
      tempPlayerSprite.setSize(14, 27);
      tempPlayerSprite.setOffset(8, 5);
    }

    // Character physics
    tempPlayerSprite.setCollideWorldBounds(true);
    this.physics.add.collider(tempPlayerSprite, this.platforms);

    return tempPlayerSprite;
  }

  setupSockets() {
    this.socket.on('server_movementUpdate', ({
      velX, velY, flip, anim, socketId,
    }) => {
      const movedPlayerSprite = this.data.get('otherPlayers').get(socketId);
      movedPlayerSprite.setVelocityX(velX);
      movedPlayerSprite.setVelocityY(velY);
      movedPlayerSprite.setFlipX(flip);
      movedPlayerSprite.anims.play(anim, true);
    });

    this.socket.on('server_positionUpdate', ({ x, y, socketId }) => {
      const movedPlayerSprite = this.data.get('otherPlayers').get(socketId);
      movedPlayerSprite.setPosition(x, y);
    });

    this.socket.on('server_tagUpdate', (socketId) => {
      this.punch.play();
      this.grunt.play();
      if (socketId === this.registry.get('socketId')) {
        this.data.get('playerSprite').isTagged = true;
        this.data.get('playerSprite').anims.play(`${this.data.get('playerSprite').character}-death`);
        this.data.get('playerSprite').setVelocity(0, 0);
      } else {
        const taggedPlayer = this.data.get('otherPlayers').get(socketId);
        taggedPlayer.anims.play(`${taggedPlayer.character}-death`);
        taggedPlayer.setVelocity(0, 0);
      }
    });

    this.socket.on('server_specialMoveGranted', ({ socketId }) => {
      const playerSprite = socketId === this.registry.get('socketId')
        ? this.data.get('playerSprite')
        : this.data.get('otherPlayers').get(socketId);

      // Set invisible for other players
      if (playerSprite.character === 'piggee') {
        playerSprite.character = 'piggee-special';
      } else if (playerSprite.character === 'piggee-special') {
        playerSprite.character = 'piggee';
        this.generateBoxThrow(
          playerSprite.x,
          playerSprite.y,
          playerSprite.flipX,
        );
      } else {
        if (socketId !== this.registry.get('socketId')) {
          playerSprite.setAlpha(0);
        } else {
          playerSprite.setAlpha(0.3);
        }
        // Make player visible after 1 second
        setTimeout(() => {
          playerSprite.setAlpha(1);
        }, 1000);
        this.generateDecoy(
          playerSprite.x,
          playerSprite.y,
          playerSprite.flipX,
          playerSprite.character,
        );
      }
    });
  }

  generateDecoy(x, y, flip, character) {
    const decoySprite = this.physics.add.sprite(x, y, `${character}-run`);

    // Character data
    decoySprite.anims.play(`${character}-run`, true);

    // Character appearance
    decoySprite.setSize(14, 27);
    decoySprite.setOffset(8, 5);

    // Character physics
    decoySprite.setCollideWorldBounds(true);
    this.physics.add.collider(decoySprite, this.platforms);

    decoySprite.setVelocityX(160 * (flip ? -1 : 1));
    decoySprite.setFlipX(decoySprite.body.velocity.x < 0);
    setTimeout(() => {
      decoySprite.anims.play(`${character}-death`);
      this.grunt.play();
    }, 3000);
  }

  generateBoxThrow(x, y, flip) {
    const decoySprite = this.physics.add.sprite(x, y, 'piggee-box');

    // Character appearance
    decoySprite.setSize(17, 14);
    decoySprite.setOffset(2, 0);
    decoySprite.setScale(1.7);

    // Character physics
    decoySprite.setCollideWorldBounds(true);
    this.physics.add.collider(decoySprite, this.platforms);

    decoySprite.setVelocityX(250 * (flip ? -1 : 1));
    decoySprite.setVelocityY(-300);
    decoySprite.setFlipX(decoySprite.body.velocity.x < 0);
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
