const TSIZE = require('./map.js').TSIZE;
const utils = require('./utils.js');

function Slime(game, col, row) {
  Phaser.Sprite.call(this, game, 0, 0, 'slime');

  this.animations.add('idle', [0, 1, 2], 6, true);
  this.animations.play('idle');

  this.move(col, row);
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
  return new Promise((resolve, reject) => {
    let dist = utils.getDistance(this, state.chara);

    if (this._canAttack(dist)) {
      let tween = this._attack(dist);
      tween.onComplete.addOnce(() => {
        this.game.tweens.remove(tween);
        resolve();
      });
    }
    else if (this._canChase(dist)) {
      this._chase(dist, state);
      resolve();
    }
    else {
      resolve();
    }
  });
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

Slime.prototype._attack = function (dist) {
  let tween = this.game.add.tween(this);
  tween.to({x: this.x + dist.cols*TSIZE, y: this.y + dist.rows * TSIZE},
     200, Phaser.Easing.Linear.None, true, 0, 0, true);

  // avoid rounding errors
  tween.onComplete.addOnce(() => {
    this.x = this.col * TSIZE;
    this.y = this.row * TSIZE;
  });

  return tween;
}

Slime.prototype._chase = function (dist, state) {
  console.log('chase');
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
    didMove = tryMove(this.col, this.row + row);
  }

  return didMove;
};

module.exports = Slime;
