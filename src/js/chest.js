'use strict';

const TSIZE = require('./map.js').TSIZE;

function Chest(game, col, row, content, sfx) {
  Phaser.Sprite.call(this, game, col * TSIZE, row * TSIZE, 'chest');
  this.content = content;
  this.sfx = sfx;
  this.isChest = true;

  this.col = col;
  this.row = row;
}

Chest.prototype = Object.create(Phaser.Sprite.prototype);
Chest.prototype.constructor = Chest;

Chest.prototype.open = function () {
  this.frame = 1;
  this.sfx.open.play();

  return new Promise((resolve) => {
    let item = this.game.make.sprite(TSIZE/2, TSIZE/2,
      this.content);
    item.anchor.setTo(0.5);
    this.addChild(item);

    let openTween = this.game.add.tween(item);
    openTween.to({y: 0}, 1000, Phaser.Easing.Sinusoidal.Out);
    let fadeTween = this.game.add.tween(this);
    fadeTween.to({alpha: 0}, 300, Phaser.Easing.Linear.None).delay(200);

    openTween.chain(fadeTween);
    openTween.start();

    fadeTween.onComplete.addOnce(() => {
      resolve(this.content);
      this.game.tweens.remove(openTween);
      this.game.tweens.remove(fadeTween);
      this.kill();
    })
  })
};


module.exports = Chest;
