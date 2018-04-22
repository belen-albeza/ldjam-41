'use strict';

const TSIZE = require('./map.js').TSIZE;
const MAX_HEALTH = 50;

function Character(game, col, row, sfx, state) {
  Phaser.Sprite.call(this, game, 0, 0, 'chara');
  this.sfx = sfx;

  this.animations.add('idle', [0], 1);
  this.animations.add('hit', [2, 1, 1, 2, 1, 1], 12);
  this.move(col, row);

  this.health = state.health || MAX_HEALTH;
  this.animations.play('idle');

  this.wearing = {
    crown: this.game.make.sprite(12, -3, 'crown'),
    robe: this.game.make.sprite(6, 30, 'robe'),
    scepter: this.game.make.sprite(39, 12, 'scepter')
  };

  for (let key in this.wearing) {
    this.addChild(this.wearing[key]);
    this.wearing[key].visible = state.wearing.includes(key);
  }

  this.wearing.scepter.animations.add('idle', [0, 1], 2, true);
  this.wearing.scepter.play('idle');
}

Character.prototype = Object.create(Phaser.Sprite.prototype);
Character.prototype.constructor = Character;

Character.prototype.canWear = function (name) {
  return name in this.wearing;
};

Character.prototype.wear = function (name) {
  this.wearing[name].visible = true;
};

Character.prototype.isWearing = function (name) {
  return this.wearing[name].visible;
};

Character.prototype.hasFullRegalia = function () {
  for (let key in this.wearing) {
    if (!this.wearing[key].visible) { return false; }
  }

  return true;
};

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

  return amount;
};

Character.prototype.attack = function (enemy, dist, logger) {
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

  let damage = enemy.getHit(this._getAttackDamage());
  logger.log(`The Princess attacked ${enemy.name} and dealt ${damage} damage.`);
  if (!enemy.alive) {
    logger.log(`${enemy.name} died!`);
  }

  return attackPromise;
};

Character.prototype._getAttackDamage = function () {
  return 15;
};

module.exports = Character;
