// eslint-disable-next-line import/extensions
import Button from './button.js';

/* eslint-disable-next-line no-undef */
export default class PostgameStage extends Phaser.Scene {
  constructor() {
    super('PostgameStage');
  }

  preload() {
    this.screenCenterX = this.registry.get('screenCenterX');
    this.screenCenterY = this.registry.get('screenCenterY');
  }

  create() {
    this.add.text(this.screenCenterX, this.screenCenterY - 100, `The ${'Team'} won!`, { backgroundColor: '#ffo', fontSize: '40px' }).setOrigin(0.5);

    this.playAgainButton = new Button(this.screenCenterX, this.screenCenterY, 'Play Again', this, () => {
      // TODO: Request server to play again
    });
    this.exitButton = new Button(this.screenCenterX, this.screenCenterY + 50, 'Exit', this, () => {
      // TODO: Tell server to disconnect
    });
  }
}
