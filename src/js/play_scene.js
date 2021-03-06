'use strict';

const utils = require('./utils.js');
const Character = require('./character.js');
const Slime = require('./slime.js');
const Map = require('./map.js');
const LifeBar = require('./lifebar.js');
const Logger = require('./logger.js');
const Status = require('./stats.js');

let PlayScene = {};

PlayScene.init = function (state) {
  this.initialState = state;
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
    walk: this.game.add.audio('sfx:walk'),
    hit: this.game.add.audio('sfx:hit'),
    chest: this.game.add.audio('sfx:chest'),
    gameover: this.game.add.audio('sfx:gameover')
  };

  if (this.initialState.isFirstTime) {
    // create song
    this.song = this.game.add.audio('bgm:main');
    this.song.volume = 0.5;
    if (this.song.isDecoded && !this.song.isPlaying) {
      this.song.loopFull();
    }
    else {
      this.song.onDecoded.addOnce(function () {
        this.song.loopFull();
      }, this);
    }
  }

  // create map
  this.map = new Map(this.game, this.initialState.mapKey);
  // create items
  this.items = this.game.add.group();
  this.map.spawnItems(this.items, {open: this.sfx.chest}, this.initialState.pickedUp);
  // create enemies
  this.enemies = this.game.add.group();
  this.map.spawnEnemies(this.enemies, {hit: this.sfx.hit});

  // create main character
  this.chara = new Character(this.game,
    this.initialState.character.col, this.initialState.character.row,
    { hit: this.sfx.hit },
    this.initialState.character);

  this.chara.events.onKilled.addOnce(() => {
    // disappear
    this.isTurnReady = false;
    this.chara.visible = true;
    this.sfx.gameover.play();
    let tween = this.game.add.tween(this.chara);
    tween.to({alpha: 0, y: this.chara.y - 128}, 1000, Phaser.Easing.Sinusoidal.In, true);
    tween.onComplete.addOnce(() => {
      this.game.tweens.remove(tween);
      // go to title screen
      this.song.stop();
      this.game.state.start('title', true, false, {isGameOver: true});
    });
  });
  this.game.add.existing(this.chara);
  this._checkForExits(this.chara.col, this.chara.row);

  // add lifebar
  this.statusBar = new Status(this.game, 0, this.game.world.height - 192,
    {health: this.chara.health});
  this.game.add.existing(this.statusBar);
  this.lifebar = this.statusBar.lifebar;

  // add logger to hud
  this.logger = new Logger(this.game, 0, this.game.world.height - 144);
  this.game.add.existing(this.logger);
  if (this.initialState.isFirstTime) {
    this.logger.log('Your adventure begins!');
    this.logger.log('Find your regalia and go to the throne room.');
  }

  // game logic
  this.isTurnReady = true;
  this.pickedUp = this.initialState.pickedUp || [];
  this.chara.events.onHit.add(() => {
    this.lifebar.setValue(this.chara.health);
  });
};

PlayScene.update = function () {
}

PlayScene.shutdown = function () {
};

PlayScene._nextTurn = function () {
  let state = {
    chara: this.chara,
    map: this.map,
    enemies: this.enemies,
    items: this.items
  };

  let promises = [];
  this.enemies.forEach((enemy) => {
    promises.push(enemy.act(state, this.logger));
  });

  Promise.all(promises)
  .then(() => {
    this.isTurnReady = true;
  })
  .catch((err) => {
    console.log('something went wrong', err);
  });
}

PlayScene._moveCharacter = function (direction) {
  this.isTurnReady = false;
  // this.logger.clear();

  let offsetCol = {left: -1, right: 1}[direction] || 0;
  let offsetRow = {up: -1, down: 1}[direction] || 0;
  let col = this.chara.col + offsetCol;
  let row = this.chara.row + offsetRow;

  let otherObject = this._getObjectAt(col, row);

  if (otherObject && otherObject.isEnemy) {
    this.chara.attack(otherObject, {cols: offsetCol, rows: offsetRow}, this.logger)
    .then(() => {
      this._nextTurn();
    });
  }
  else if (otherObject && otherObject.isChest) {
    otherObject.open()
    .then((data) => {
      this.logger.log(`You found: ${data.content}`);
      if (this.chara.canWear(data.content)) {
        this.logger.log(`You are now wearing: ${data.content}`);
        this.chara.wear(data.content);
      }
      this.pickedUp.push(data.id);
      this._nextTurn();
    });
  }
  else if (otherObject && otherObject.isThrone) {
    if (this.chara.hasFullRegalia()) {
      otherObject.kill();
      this.logger.log('Finally! Your kingdom awaits!');
    }
    else {
      this.logger.log('You need to pickup your full regalia first.');
    }
    this._nextTurn();
  }
  else if (this.map.canMoveCharacter(col, row) && !otherObject) {
    this.sfx.walk.play();

    this._checkForExits(col, row);
    this.chara.move(col, row);
    this._nextTurn();
  }
  else {
    this.isTurnReady = true;
  }
};

PlayScene._checkForExits = function (col, row) {
  if (col < 0 || row < 0 || col >= Map.COLS || row >= Map.ROWS) { // out of map
    if (this.exit.isVictory) {
      this.game.state.start('title', true, false, {isVictory: true});
      if (this.song) { this.song.stop(); }
    }
    else {
      // execute current exit
      this.game.state.restart(true, false, {
        mapKey: `map:${this.exit.to}`,
        character: {
          col: this.exit.col,
          row: this.exit.row,
          health: this.chara.health,
          wearing: Object.keys(this.chara.wearing).filter(x => this.chara.isWearing(x))
        },
        pickedUp: this.pickedUp
      });
    }
  }
  else { // in map
    // check if this tile would lead to an exit
    this.exit = this.map.getExit(col, row);
  }
};

PlayScene._getObjectAt = function (col, row) {
  return utils.getObjectAt(col, row, {enemies: this.enemies, items: this.items});
};

module.exports = PlayScene;
