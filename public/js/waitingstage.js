// eslint-disable-next-line import/extensions
import Button from './button.js';

// eslint-disable-next-line no-undef
export default class WaitingStage extends Phaser.Scene {
  constructor() {
    super('WaitingStage');
    this.playerCircles = new Set();
  }

  preload() {
    this.screenCenterX = this.cameras.main.worldView.x + this.cameras.main.width / 2;
    this.screenCenterY = this.cameras.main.worldView.y + this.cameras.main.height / 2;
  }

  create() {
    // Setup connections for socket.io
    this.socket = this.registry.get('socket');
    this.setupSockets();
    this.button = new Button(400, 400, 'Ready', this, () => {
      this.socket.emit('client_playerReady');
    });
  }

  setupSockets() {
    // Updates when waiting room queue changes
    this.socket.on('server_waitingRoomUpdate', (waitingRoomPlayers) => {
      const readyPlayers = waitingRoomPlayers.filter((player) => player.isReady).length;
      this.updatePlayerCircles(readyPlayers, waitingRoomPlayers.length);
    });
  }

  updatePlayerCircles(readyPlayers, totalPlayers) {
    // Destroy existing circles
    this.playerCircles.forEach((circle) => {
      circle.destroy();
    });

    // Create dynamically colored circle for every player
    for (let i = 0; i < totalPlayers; i += 1) {
      this.playerCircles.add(
        this.add.circle(
          (this.screenCenterX - ((totalPlayers - 1) * 50) / 2) + i * 50,
          this.screenCenterY - 20,
          15,
          i < readyPlayers ? 0x00bf19 : 0x575757,
        ),
      );
    }
  }
}