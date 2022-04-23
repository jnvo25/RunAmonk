// eslint-disable-next-line no-undef
export default class GameStage extends Phaser.Scene {
  constructor() {
    super('GameStage');
  }

  create() {
    this.socket = this.registry.get('socket');
    this.setupSockets();

    console.log(this.registry.get('gameRoomOccupants'));
  }

  setupSockets() {
    this.socket.on('server_playerUpdate', (gameRoomOccupants) => {
      console.log('Server sent player update', gameRoomOccupants);
    });
  }
}
