'use strict';

const MESSAGE_COUNT = 4;
const STYLE = {
  font: '20pt Patrick Hand',
  fill: '#ce186a'
};
const LINE_HEIGHT = 30;

function Logger(game, x, y) {
  Phaser.Group.call(this, game);
  this.position.setTo(x, y);

  this.add(this.game.make.image(0, 0, 'hud:logger'));

  this.messages = [];
  this.messageLabels = [];
  for (let i = 0; i < MESSAGE_COUNT; i++) {
    let label = this.game.make.text(10, 10 + i * LINE_HEIGHT, '', STYLE);
    label.alpha = 1 - i / MESSAGE_COUNT;
    this.messageLabels.push(label);
    this.add(label);
  };
}

Logger.prototype = Object.create(Phaser.Group.prototype);
Logger.prototype.constructor = Logger;

Logger.prototype.log = function (message) {
  console.log(message);

  this.messages.unshift(message);
  if (this.messages.length > MESSAGE_COUNT) { this.messages.pop(); }
  this._updateLabels();
}

Logger.prototype.clear = function () {
  this.messages = [];
  this._updateLabels();
}

Logger.prototype._updateLabels = function () {
  this.messageLabels.forEach((label, i) => {
    label.setText(i < this.messages.length ? this.messages[i] : '');
  });
};

module.exports = Logger;
