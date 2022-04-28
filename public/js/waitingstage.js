/* eslint-disable no-undef */
export default class WaitingStage extends Phaser.Scene {
  constructor() {
    super('WaitingStage');
  }

  preload() {
    this.screenCenterX = this.registry.get('screenCenterX');
    this.screenCenterY = this.registry.get('screenCenterY');
  }

  create() {
    this.add.text(this.screenCenterX, this.screenCenterY, 'Please wait, game in session', {backgroundColor: '#ffo', fontSize: '40px'}).setOrigin(0.5);
  }
}
