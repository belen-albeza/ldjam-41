'use strict';

const utils = require('./utils.js');
const Character = require('./character.js');
const Slime = require('./slime.js');
const Map = require('./map.js');

let PlayScene = {};

PlayScene.init = function (mapData) {
  this.mapData = mapData;
};

PlayScene.create = function () {
  // create keys
  this.keys = this.game.input.keyboard.addKeys({
    up: Phaser.KeyCode.UP,
    down: Phaser.KeyCode.DOWN,
    left: Phaser.KeyCode.LEFT,
    right: Phaser.KeyCode.RIGHT,
    wait: Phaser.KeyCode.SPACEBAR
  });
  for (let key in this.keys) {
    this.keys[key].onDown.add(function () {
      if (this.isTurnReady) { this._moveCharacter(key); }
    }, this);
  }

  // create sfx
  this.sfx = {
    walk: this.game.add.audio('sfx:walk')
  };

  // create map
  this.map = new Map(this.game, this.mapData.key);
  // create enemies
  this.enemies = this.game.add.group();
  this.map.spawnEnemies(this.enemies);

  // create main character
  this.chara = new Character(this.game, this.mapData.col, this.mapData.row);
  this.game.add.existing(this.chara);
  this._checkForExits(this.chara.col, this.chara.row);

  // create HUD
  this.hud = this.game.add.group();
  this.hud.position.set(0, this.game.world.height - 144);
  this.hud.add(this.game.make.image(0, 0, 'hud'));
  let txt = this.game.make.text(this.hud.width - 16, this.hud.height - 8,
    'MOVE: ←↑↓→ WAIT: space', { fill: '#ce186a', font: '20pt Patrick Hand' });
  txt.anchor.set(1, 1);
  this.hud.add(txt);

  // game logic
  this.isTurnReady = true;
};

PlayScene.update = function () {
}

PlayScene._nextTurn = function () {
  this.isTurnReady = false;

  let state = {
    chara: this.chara,
    map: this.map,
    enemies: this.enemies
  };

  let promises = [];
  this.enemies.forEach((enemy) => {
    promises.push(enemy.act(state));
  });

  Promise.all(promises)
  .then(() => {
    this.isTurnReady = true;
    console.log('next turn');
  })
  .catch((err) => {
    console.log('something went wrong', err);
  });
}

PlayScene._moveCharacter = function (direction) {
  let offsetCol = {left: -1, right: 1}[direction] || 0;
  let offsetRow = {up: -1, down: 1}[direction] || 0;
  let col = this.chara.col + offsetCol;
  let row = this.chara.row + offsetRow;

  if (this.map.canMoveCharacter(col, row) && !this._getObjectAt(col, row)) {
    this.sfx.walk.play();

    this._checkForExits(col, row);
    this.chara.move(col, row);
    this._nextTurn();
  }
};

PlayScene._checkForExits = function (col, row) {
  if (col < 0 || row < 0 || col >= Map.COLS || row >= Map.ROWS) { // out of map
    // execute current exit
    this.game.state.restart(true, false, {
      key: `map:${this.exit.to}`,
      col: this.exit.col,
      row: this.exit.row
    });
  }
  else { // in map
    // check if this tile would lead to an exit
    this.exit = this.map.getExit(col, row);
  }
};

PlayScene._getObjectAt = function (col, row) {
  return utils.getObjectAt(col, row, {enemies: this.enemies});
};

module.exports = PlayScene;
