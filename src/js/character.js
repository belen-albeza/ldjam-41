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

  this.wearing = {
    crown: this.game.make.sprite(TSIZE / 2, 9, 'crown')
  };

  this.wearing.crown.anchor.setTo(0.5, 1);
  this.addChild(this.wearing.crown);
}

Character.prototype = Object.create(Phaser.Sprite.prototype);
Character.prototype.constructor = Character;

Character.prototype.move = function (col, row) {
  this.x = col * TSIZE;
  this.y = row * TSIZE;
  this.col = col;
  this.row = row;
};

Character.prototype.getHit = function (amount) {
  this.animations.play('hit').onComplete.addOnce(() => {
    this.animations.play('idle');
  });
  this.sfx.hit.play();

  this.damage(amount);
};

Character.prototype.attack = function (enemy, dist) {
  let tween = this.game.add.tween(this);
  tween.to({ x: this.x + dist.cols * TSIZE, y: this.y + dist.rows * TSIZE },
    200, Phaser.Easing.Linear.None, true, 0, 0, true);

  let attackPromise = new Promise((resolve) => {
    // avoid rounding errors
    tween.onComplete.addOnce(() => {
      this.x = this.col * TSIZE;
      this.y = this.row * TSIZE;
      this.game.tweens.remove(tween);
      resolve();
    });
  });

  enemy.getHit(this._getAttackDamage());

  return attackPromise;
};

Character.prototype._getAttackDamage = function () {
  return 15;
};

module.exports = Character;
