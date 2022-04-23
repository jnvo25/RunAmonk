// eslint-disable-next-line no-undef
export default class GameStage extends Phaser.Scene {
  constructor() {
    super('GameStage');
  }

  preload() {
    // Load stage assets
    this.load.image('background', 'assets/maps/images/background.png');
    this.load.image('spike', 'assets/maps/images/spike.png');
    this.load.image('tiles', 'assets/maps/tilesets/terrain_tilesheet.png');
    this.load.tilemapTiledJSON('map', 'assets/maps/tilemaps/homestage.json');
  }

  create() {
    // Create stage
    const backgroundImage = this.add.image(0,0, 'background').setOrigin(0,0);
    backgroundImage.setScale(2, 0.8);
    const map = this.make.tilemap({ key: 'map' });
    const tileset = map.addTilesetImage('terrain_tilesheet', 'tiles');
    const platforms = map.createStaticLayer('Platforms', tileset, 0, 0);
    platforms.setCollisionByExclusion(-1, true);

    // Setup communications with server
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
