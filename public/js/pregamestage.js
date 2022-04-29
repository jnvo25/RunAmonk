// eslint-disable-next-line import/extensions
import Button from './button.js';

// eslint-disable-next-line no-undef
export default class PregameStage extends Phaser.Scene {
  constructor() {
    super('PregameStage');
  }

  create() {
    this.playerCircles = new Set();
    this.setupSockets();
    this.button = new Button(400, 400, 'Ready', this, () => {
      this.socket.emit('client_playerReady');
    });
  }

  setupSockets() {
    this.socket = this.registry.get('socket');

    // Updates when waiting room queue changes
    this.socket.on('server_pregameRoomUpdate', (pregameRoomPlayers) => {
      const readyPlayers = pregameRoomPlayers.filter((player) => player.isReady).length;
      this.updatePlayerCircles(readyPlayers, pregameRoomPlayers.length);
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
          (this.registry.get('screenCenterX') - ((totalPlayers - 1) * 50) / 2) + i * 50,
          this.registry.get('screenCenterY') - 20,
          15,
          i < readyPlayers ? 0x00bf19 : 0x575757,
        ),
      );
    }
  }
}
