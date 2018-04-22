const LifeBar = require('./lifebar.js');

function Stats(game, x, y, data) {
  Phaser.Group.call(this, game);
  this.position.setTo(x, y);

  this.add(this.game.make.image(0, 0, 'hud:status'));

  this.lifebar = new LifeBar(this.game, 14, 10, data.health);
  this.add(this.lifebar);

  let txt = this.game.make.text(this.width - 14, 10,
    'MOVE: ←↑↓→ WAIT: space', { fill: '#fff', font: '20pt Patrick Hand' });
  txt.anchor.set(1, 0);
  this.add(txt);
}

Stats.prototype = Object.create(Phaser.Group.prototype);
Stats.prototype.constructor = Stats;

module.exports = Stats;
