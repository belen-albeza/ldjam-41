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

  if (this._canAttack(dist)) {
    console.log('attack!');
  }
  else if (this._canChase(dist)) {
    const tryMove = (col, row) => {
      let canMove = state.map.canMoveCharacter(col, row) &&
        !utils.getObjectAt(col, row, state);
      if (canMove) {
        this.move(col, row);
      }

      return canMove;
    }

    let col = dist.cols !== 0 ? Math.sign(dist.cols) : 0;
    let row = dist.rows !== 0 ? Math.sign(dist.rows) : 0;

    let didMove = false;
    if (col !== 0) {
      didMove = tryMove(this.col + col, this.row);
    }
    if (!didMove && row !== 0) {
      tryMove(this.col, this.row + row);
    }
  }
}

Slime.prototype._canAttack = function (dist) {
  // is character a 4-neighbor?
  return (dist.cols === 0 && Math.abs(dist.rows) <= 1) ||
    (dist.rows === 0 && Math.abs(dist.cols) <= 1);
}

Slime.prototype._canChase = function (dist) {
  const AREA = 3;
  return Math.abs(dist.cols) <= AREA && Math.abs(dist.rows) <= AREA;
}

module.exports = Slime;
