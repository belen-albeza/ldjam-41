'use strict';

const TSIZE = require('./map.js').TSIZE;

function Character(game, col, row) {
  Phaser.Sprite.call(this, game, 0, 0, 'chara');
  this.move(col, row);
}

Character.prototype = Object.create(Phaser.Sprite.prototype);
Character.prototype.constructor = Character;

Character.prototype.move = function (col, row) {
  this.x = col * TSIZE;
  this.y = row * TSIZE;
  this.col = col;
  this.row = row;
};

module.exports = Character;
