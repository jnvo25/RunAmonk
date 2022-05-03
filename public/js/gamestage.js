function getTime(startTime, gameDuration) {
  return Math.floor((gameDuration / 1000) - (Date.now() - startTime) / 1000);
}

// eslint-disable-next-line no-undef
export default class GameStage extends Phaser.Scene {
  constructor() {
    super('GameStage');
  }

  // preload() {
  //   // this.load.setPath('assets/audio/tech');

  // }

  create() {
    // Setup communications with server
    this.socket = this.registry.get('socket');
    if (this.registry.get('firstRun')) this.setupSockets();

    // Get variables ready
    this.registry.set('chaserGroup', this.add.group());
    this.registry.set('runnerGroup', this.add.group());
    this.data.set('boxGroup', this.add.group());
    this.cursors = this.registry.get('cursors');
    this.data.set('clientTagged', false);

    // Handle overlap tag
    this.physics.add.overlap(this.registry.get('runnerGroup'), this.registry.get('chaserGroup'), (player1, player2) => {
      if (!player1.isChaser) {
        this.registry.get('runnerGroup').remove(player1);
        player1.setAlpha(1);
      }
      if (!player2.isChaser) {
        this.registry.get('runnerGroup').remove(player2);
        player2.setAlpha(1);
      }
      if (!this.data.get('playerSprite').isChaser) {
        this.registry.get('socket').emit('client_tagged');
      }
    });

    this.physics.add.collider(this.registry.get('runnerGroup'), this.data.get('boxGroup'), (runner, box) => {
      this.registry.get('small-punch').play();
      this.registry.get('crate-break').play();
      box.destroy();
      if (runner.id === this.registry.get('socketId')) {
        this.registry.get('socket').emit('client_slowed');
      }
    });

    // Create player
    const playerData = this.registry.get('playerData');
    this.data.set('playerSprite', this.createPlayer(this.registry.get('socketId'), playerData.position.x, playerData.position.y, playerData.character, playerData.isChaser, playerData.speed));

    // Create other players
    const iterator = this.registry.get('gameRoomOccupants').entries();
    const otherPlayers = new Map();
    let iteratorData = iterator.next();
    while (!iteratorData.done) {
      const {
        position, character, isChaser, speed,
      } = iteratorData.value[1];
      const { x, y } = position;
      otherPlayers.set(
        iteratorData.value[0],
        this.createPlayer(iteratorData.value[0], x, y, character, isChaser, speed),
      );
      iteratorData = iterator.next();
    }
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
    const playerSprite = this.data.get('playerSprite');

    if (this.registry.get('spacebar').isUp) {
      if (playerSprite.character === 'piggee-special') {
        this.registry.get('socket').emit('client_specialMove', { x: playerSprite.x, y: playerSprite.y });
      }
    }

    if (this.registry.get('spacebar').isDown) {
      if (playerSprite.character === 'piggee' && Date.now() - this.specialMoveTime >= 5000) {
        this.registry.get('socket').emit('client_changeCharacter');
      } else if (playerSprite.character !== 'piggee-special') {
        this.registry.get('socket').emit('client_specialMove');
      }
    }

    if (this.cursors.up.isDown) {
      if (playerSprite.body.onFloor()) {
        this.registry.get('jump').play();
        playerSprite.setVelocityY(-400);
      }
    }
    if (this.cursors.left.isDown) {
      playerSprite.setVelocityX(-playerSprite.speed);
      playerSprite.setFlipX(true);
      playerSprite.anims.play(`${playerSprite.character}-run`, true);
    } else if (this.cursors.right.isDown) {
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
    if (!Object.is(playerMovementData, this.data.get('prevPlayerMovementData'))) {
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
    this.physics.add.collider(tempPlayerSprite, this.registry.get('platforms'));

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
        this.destroyOnAnimationComplete(this.data.get('playerSprite'));
      } else {
        this.destroyOnAnimationComplete(this.data.get('otherPlayers').get(socketId));
      }
    });

    this.socket.on('server_speedUpdate', ({ speed, duration }) => {
      this.data.get('playerSprite').speed = speed;
      setTimeout(() => {
        this.data.get('playerSprite').speed = this.registry.get('playerData').speed;
      }, duration);
    });

    this.socket.on('server_changeCharacter', ({ socketId, character }) => {
      const changingPlayerSprite = (this.registry.get('socketId') === socketId)
        ? this.data.get('playerSprite')
        : this.data.get('otherPlayers').get(socketId);
      changingPlayerSprite.character = character;
    });

    this.socket.on('server_specialMoveGranted', ({ position, socketId }) => {
      let playerSprite;
      if (socketId === this.registry.get('socketId')) {
        this.specialMoveTime = Date.now();
        playerSprite = this.data.get('playerSprite');
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
    if (this.anims.exists(`${sprite.character}-death`)) sprite.anims.play(`${sprite.character}-death`);
    sprite.once('animationcomplete', () => {
      sprite.destroy();
    });
  }

  generateBoxThrow(x, y, flip) {
    const boxSprite = this.physics.add.sprite(x, y, 'piggee-box');

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
    this.data.get('boxGroup').add(boxSprite);
  }
}
