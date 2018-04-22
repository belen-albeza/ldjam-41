'use strict';

const FONT = '20pt Patrick Hand';
const FONT_COLOR = '#ce186a';

function LifeBar(game, x, y, value) {
  Phaser.Group.call(this, game);
  this.position.setTo(x, y);

  this._maxValue = value;

  this.label = this.game.make.text(0, 0, `Life: ${value}`, {
    font: FONT,
    fill: FONT_COLOR
  });

  this.add(this.label);
}

LifeBar.prototype = Object.create(Phaser.Group.prototype);
LifeBar.prototype.constructor = LifeBar;

LifeBar.prototype.setValue = function (value) {
  this.label.setText(`Life: ${value}`);
};

module.exports = LifeBar;
