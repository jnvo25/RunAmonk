function getTime(startTime, gameDuration) {
  return Math.floor((gameDuration / 1000) - (Date.now() - startTime) / 1000);
}

// eslint-disable-next-line no-undef
export default class GameStage extends Phaser.Scene {
  constructor() {
    super('GameStage');
  }

  create() {
    // Setup communications with server
    this.socket = this.registry.get('socket');
    if (this.registry.get('firstRun')) this.setupSockets();
    this.data.set('clientTagged', false);

    // Get variables ready
    this.data.set('allPlayerSprites', this.add.group());
    this.data.set('projectileSprites', this.add.group());

    // Add collision detections between groups
    this.physics.add.collider(this.data.get('allPlayerSprites'), this.data.get('projectileSprites'), (playerSprite, projectileSprite) => {
      this.registry.get('small-punch').play();
      if (projectileSprite.type === 'box') this.registry.get('crate-break').play();
      projectileSprite.destroy();
      if (playerSprite.id === this.registry.get('socketId')) {
        this.registry.get('socket').emit('client_slowed');
      }
    });

    // Create sprite for each player and place in a set (for checking) and map (changing)
    const playerStartData = this.registry.get('playerStartData');
    const otherPlayers = new Map();
    playerStartData.forEach((element) => {
      const {
        position, character, isChaser, speed,
      } = element[1];
      const { x, y } = position;
      const tempSprite = this.createPlayer(element[0], x, y, character, isChaser, speed);
      this.data.get('allPlayerSprites').add(tempSprite);
      if (this.registry.get('socketId') === element[0]) {
        // Sprite created is for client
        // Detect collisions with client's sprite
        this.physics.add.overlap(tempSprite, this.data.get('allPlayerSprites'), (clientPlayer, otherPlayer) => {
          if (otherPlayer.isChaser) this.registry.get('socket').emit('client_tagged');
        });

        // Make data easily accessible
        this.data.set('playerData', element[1]);
        this.data.set('clientSprite', tempSprite);
      } else {
        // Sprite created is for a different client
        otherPlayers.set(element[0], tempSprite);
      }
    });
    this.data.set('otherPlayers', otherPlayers);

    // Create timer
    this.timer = this.add.text(738, 35, (this.registry.get('gameDuration') - Date.now() - this.registry.get('startTime')), { backgroundColor: '#ffo', fontSize: '40px' }).setOrigin(0.5);
    this.specialMoveTime = 0;
    this.specialTimer = this.add.text(125, 35, '', { backgroundColor: '#ffo', fontSize: '20px' }).setOrigin(0.5);

    this.registry.get('background').play();
  }

  update() {
    if (!this.data.get('clientTagged')) this.readPlayerInput();
    const gameTime = getTime(this.registry.get('startTime'), this.registry.get('gameDuration'));
    if (gameTime > 0) {
      this.timer.setText(gameTime);
    } else {
      this.timer.setText('');
    }

    // Special timer
    const specialTime = getTime(this.specialMoveTime, 6000);
    if (specialTime > 0) {
      this.specialTimer.setText(`SkillCooldown: ${specialTime}`);
    } else {
      this.specialTimer.setText('');
    }
  }

  readPlayerInput() {
    const playerSprite = this.data.get('clientSprite');
    if (this.registry.get('spacebar').isUp) {
      if (playerSprite.character === 'piggee-special') {
        this.registry.get('socket').emit('client_specialMove', { x: playerSprite.x, y: playerSprite.y });
      }
    }

    if (this.registry.get('spacebar').isDown && Date.now() - this.specialMoveTime >= 5000) {
      if (playerSprite.character === 'piggee') this.registry.get('socket').emit('client_changeCharacter');
      else if (playerSprite.character !== 'piggee-special') {
        this.registry.get('socket').emit('client_specialMove', { x: playerSprite.x, y: playerSprite.y });
        this.specialMoveTime = Date.now();
      }
    }

    if (this.registry.get('cursors').up.isDown) {
      if (playerSprite.body.onFloor()) {
        this.registry.get('jump').play();
        playerSprite.setVelocityY(-400);
      }
    }
    if (this.registry.get('cursors').left.isDown) {
      playerSprite.setVelocityX(-playerSprite.speed);
      playerSprite.setFlipX(true);
      playerSprite.anims.play(`${playerSprite.character}-run`, true);
    } else if (this.registry.get('cursors').right.isDown) {
      playerSprite.setVelocityX(playerSprite.speed);
      playerSprite.setFlipX(false);
      playerSprite.anims.play(`${playerSprite.character}-run`, true);
    } else {
      playerSprite.setVelocityX(0);
      playerSprite.anims.play(`${playerSprite.character}-idle`, true);
    }

    const playerMovementData = {
      velX: playerSprite.body.velocity.x,
      velY: playerSprite.body.velocity.y,
      flip: playerSprite.flipX,
      anim: playerSprite.anims.getName(),
    };
    if (!this.data.get('prevPlayerMovementData') || (playerMovementData.velX !== this.data.get('prevPlayerMovementData').velX || playerMovementData.velY !== this.data.get('prevPlayerMovementData').velY)) {
      this.registry.get('socket').emit('client_movementUpdate', { ...playerMovementData });
      this.data.set('prevPlayerMovementData', playerMovementData);
    }
    if (!this.data.get('positionLastUpdated') || Date.now() - this.data.get('positionLastUpdated') > 500) {
      this.registry.get('socket').emit('client_positionUpdate', {
        x: playerSprite.x,
        y: playerSprite.y,
      });
    }
  }

  createPlayer(socketId, positionX, positionY, character, isChaser, speed) {
    const tempPlayerSprite = this.physics.add.sprite(positionX, positionY, `${character}-idle`);

    // Character data
    tempPlayerSprite.anims.play(`${character}-idle`, true);
    tempPlayerSprite.id = socketId;
    tempPlayerSprite.character = character;
    tempPlayerSprite.isChaser = isChaser;
    tempPlayerSprite.speed = speed;

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
    this.physics.add.collider(tempPlayerSprite, this.registry.get('platforms'));
    this.data.get('allPlayerSprites').add(tempPlayerSprite);

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
      this.registry.get('punch').play();
      this.registry.get('grunt').play();
      if (socketId === this.registry.get('socketId')) {
        this.data.set('clientTagged', true);
        this.destroyOnAnimationComplete(this.data.get('clientSprite'));
      } else {
        this.destroyOnAnimationComplete(this.data.get('otherPlayers').get(socketId));
      }
    });

    this.socket.on('server_speedUpdate', ({ speed, duration }) => {
      this.data.get('clientSprite').speed = speed;
      setTimeout(() => {
        this.data.get('clientSprite').speed = this.data.get('playerData').speed;
      }, duration);
    });

    this.socket.on('server_changeCharacter', ({ socketId, character }) => {
      const changingPlayerSprite = (this.registry.get('socketId') === socketId)
        ? this.data.get('clientSprite')
        : this.data.get('otherPlayers').get(socketId);
      changingPlayerSprite.character = character;
    });

    this.socket.on('server_specialMoveGranted', ({ position, socketId }) => {
      let playerSprite;
      if (socketId === this.registry.get('socketId')) {
        this.specialMoveTime = Date.now();
        playerSprite = this.data.get('clientSprite');
      } else {
        playerSprite = this.data.get('otherPlayers').get(socketId);
      }

      // Set invisible for other players
      if (playerSprite.character === 'piggee-special') {
        playerSprite.character = 'piggee';
        this.registry.get('pig-grunt').play();
        this.generateBoxThrow(
          position.x,
          position.y,
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
          position.x,
          position.y,
          playerSprite.flipX,
          playerSprite.character,
          playerSprite.speed,
        );
      }
    });
  }

  generateDecoy(x, y, flip, character, speed) {
    const decoySprite = this.physics.add.sprite(x, y, `${character}-run`);

    // Character data
    decoySprite.anims.play(`${character}-run`, true);
    decoySprite.character = character;

    // Character appearance
    decoySprite.setSize(14, 27);
    decoySprite.setOffset(8, 5);

    // Character physics
    decoySprite.setCollideWorldBounds(true);
    this.physics.add.collider(decoySprite, this.registry.get('platforms'));

    decoySprite.setVelocityX(speed * (flip ? -1 : 1));
    decoySprite.setFlipX(decoySprite.body.velocity.x < 0);
    setTimeout(() => {
      this.destroyOnAnimationComplete(decoySprite);
      this.registry.get('grunt').play();
    }, 3000);
  }

  destroyOnAnimationComplete(sprite) {
    sprite.setAlpha(1);
    if (this.anims.exists(`${sprite.character}-death`)) sprite.anims.play(`${sprite.character}-death`);
    sprite.once('animationcomplete', () => {
      sprite.destroy();
    });
  }

  generateBoxThrow(x, y, flip) {
    const boxSprite = this.physics.add.sprite(x, y, 'piggee-box');
    boxSprite.type = 'box';

    // Character appearance
    boxSprite.setSize(17, 14);
    boxSprite.setOffset(2, 0);
    boxSprite.setScale(1.7);

    // Character physics
    boxSprite.setCollideWorldBounds(true);
    this.physics.add.collider(boxSprite, this.registry.get('platforms'), (collisionDetail) => {
      if (collisionDetail.body.newVelocity.x === 0) {
        if (Math.random() > 0.5) this.registry.get('box-break').play();
        else this.registry.get('crate-break').play();
        boxSprite.destroy();
      }
    });

    boxSprite.setVelocityX(250 * (flip ? -1 : 1));
    boxSprite.setVelocityY(-300);
    boxSprite.setFlipX(boxSprite.body.velocity.x < 0);
    this.data.get('projectileSprites').add(boxSprite);
  }
}
