'use strict';
const TITLE_FONT = '72pt Patrick Hand';
const SMALL_FONT = '28pt Patrick Hand';
const DARK_COLOR = '#ce186a';
const SHADOW_COLOR = '#53034b';
const LIGHT_COLOR = '#fff';

const TitleScene = {};

TitleScene.init = function (data) {
  this.data = data;
};

TitleScene.create = function () {
  this.keys = this.game.input.keyboard.addKeys({
    space: Phaser.KeyCode.SPACEBAR
  });

  let titleMsg = 'Rogue Princess';
  if (this.data.isVictory) { titleMsg = 'Crowned!'; }
  if (this.data.isGameOver) { titleMsg = 'Game Over'; }

  this.game.add.image(0, 0, (this.data.isVictory || this.data.isGameOver) ?
    'title:empty' : 'title');

  let help = this.game.add.text(this.game.width / 2, this.game.height / 2 + 48,
    'Press <SPACEBAR> to start', { font: SMALL_FONT, fill: LIGHT_COLOR});
  help.anchor.setTo(0.5);
  help.setShadow(1, 1, SHADOW_COLOR, 0);

  let title = this.game.add.text(this.game.width / 2, this.game.height / 2 - 72,
    titleMsg, { font: TITLE_FONT, fill: LIGHT_COLOR});
  title.anchor.setTo(0.5);
  title.setShadow(4, 4, SHADOW_COLOR, 0);

  if (this.data.isVictory) {
    let princess = this.game.add.image(this.game.width / 2, this.game.height / 2, 'princess');
    princess.anchor.setTo(0.5);
    help.y += 200;
    title.y -= 128;
  }



  this.game.add.tween(help.scale)
    .to({x: 1.25, y: 1.25}, 1000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);

  this.keys.space.onUp.addOnce(() => {
    this.game.state.start('play', true, false, {
      mapKey: 'map:00',
      character: {
        col: 7,
        row: 2,
        wearing: []
      },
      isFirstTime: true,
      pickedUp: []
    });
  });
}

module.exports = TitleScene;
