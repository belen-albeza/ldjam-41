const TSIZE = require('./map.js').TSIZE;
const utils = require('./utils.js');

function Slime(game, col, row) {
  Phaser.Sprite.call(this, game, 0, 0, 'slime');
  this.animations.add('idle', [0, 1, 2], 6, true);

  this.move(col, row);
  this.animations.play('idle');
}

Slime.prototype = Object.create(Phaser.Sprite.prototype);
Slime.prototype.constructor = Slime;

Slime.prototype.move = function (col, row) {
  this.x = col * TSIZE;
  this.y = row * TSIZE;
  this.col = col;
  this.row = row;
};

Slime.prototype.act = function (state) {
  let dirs = [];
  let dist = utils.getDistance(this, state.chara);

  console.log('slime at', `${this.col}, ${this.row}`, 'acting…');
  if (this._canAttack(dist)) {
    console.log('attack!');
  }
}

Slime.prototype._canAttack = function (dist) {
  // is character a 4-neighbor?
  return (dist.cols === 0 && Math.abs(dist.rows) <= 1) ||
    (dist.rows === 0 && Math.abs(dist.cols) <= 1);
}

module.exports = Slime;
