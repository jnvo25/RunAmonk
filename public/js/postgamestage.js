// eslint-disable-next-line import/extensions
import Button from './button.js';

/* eslint-disable-next-line no-undef */
export default class PostgameStage extends Phaser.Scene {
  constructor() {
    super('PostgameStage');
  }

  create() {
    this.add.text(this.registry.get('screenCenterX'), this.registry.get('screenCenterY') - 100, `The ${'Team'} won!`, { backgroundColor: '#ffo', fontSize: '40px' }).setOrigin(0.5);

    this.playAgainButton = new Button(this.registry.get('screenCenterX'), this.registry.get('screenCenterY'), 'Play Again', this, () => {
      this.registry.get('socket').emit('client_playAgain');
    });
    this.exitButton = new Button(this.registry.get('screenCenterX'), this.registry.get('screenCenterY') + 50, 'Exit', this, () => {
      // TODO: Tell server to disconnect
    });
  }
}
