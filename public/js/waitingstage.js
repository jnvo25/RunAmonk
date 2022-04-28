function getTime(startTime, gameDuration) {
  return Math.floor((gameDuration / 1000) - (Date.now() - startTime) / 1000);
}

/* eslint-disable no-undef */
export default class WaitingStage extends Phaser.Scene {
  constructor() {
    super('WaitingStage');
  }

  create() {
    this.add.text(this.registry.get('screenCenterX'), this.registry.get('screenCenterY'), 'Please wait, game in session', { backgroundColor: '#ffo', fontSize: '40px' }).setOrigin(0.5);
    this.timer = this.add.text(this.registry.get('screenCenterX'), this.registry.get('screenCenterY') + 100, (this.registry.get('gameDuration') - Date.now() - this.registry.get('startTime')), { backgroundColor: '#ffo', fontSize: '40px' }).setOrigin(0.5);
  }

  update() {
    this.timer.setText(getTime(this.registry.get('startTime'), this.registry.get('gameDuration')));
  }
}
