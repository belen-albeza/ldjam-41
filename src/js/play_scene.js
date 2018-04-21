'use strict';

const Character = require('./character.js');

let PlayScene = {};

PlayScene.create = function () {
  // create keys
  this.keys = this.game.input.keyboard.createCursorKeys();
  for (let key in this.keys) {
    this.keys[key].onDown.add(function () {
      this._moveCharacter(key);
    }, this);
  }

  // create sfx
  this.sfx = {
    walk: this.game.add.audio('sfx:walk')
  };

  // create & setup map
  this.map = this.game.add.tilemap('map:00');
  this.map.addTilesetImage('tileset', 'tileset');
  this.mapLayers = {
    background: this.map.createLayer('background'),
    obstacles: this.map.createLayer('walls')
  };
  this.mapLayers.background.resizeWorld();

  // create main character
  this.chara = new Character(this.game, 5, 5);
  this.game.add.existing(this.chara);
};

PlayScene.update = function () {
}

PlayScene._nextTurn = function () {
  console.log('next turn');
}

PlayScene._moveCharacter = function (direction) {
  let offsetCol = {left: -1, right: 1}[direction] || 0;
  let offsetRow = {up: -1, down: 1}[direction] || 0;
  let col = this.chara.col + offsetCol;
  let row = this.chara.row + offsetRow;

  if (this._canMoveCharacter(col, row)) {
    this.chara.move(col, row);
    this.sfx.walk.play();
    this._nextTurn();
  }
};

PlayScene._canMoveCharacter = function (col, row) {
  return this.map.getTile(col, row, this.mapLayers.obstacles) === null;
};

module.exports = PlayScene;
