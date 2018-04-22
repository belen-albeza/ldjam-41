'use strict';

const TSIZE = require('./map.js').TSIZE;
const MAX_HEALTH = 50;

function Character(game, col, row, sfx) {
  Phaser.Sprite.call(this, game, 0, 0, 'chara');
  this.sfx = sfx;

  this.animations.add('idle', [0], 1);
  this.animations.add('hit', [2, 1, 1, 2, 1, 1], 12);
  this.move(col, row);

  this.health = MAX_HEALTH;
  this.animations.play('idle');
}

Character.prototype = Object.create(Phaser.Sprite.prototype);
Character.prototype.constructor = Character;

Character.prototype.move = function (col, row) {
  this.x = col * TSIZE;
  this.y = row * TSIZE;
  this.col = col;
  this.row = row;
};

Character.prototype.hit = function (amount) {
  this.animations.play('hit').onComplete.addOnce(() => {
    this.animations.play('idle');
  });
  this.sfx.hit.play();

  this.damage(amount);
};

module.exports = Character;
