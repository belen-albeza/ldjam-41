(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
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

},{"./map.js":3}],2:[function(require,module,exports){
'use strict';

var PlayScene = require('./play_scene.js');

var BootScene = {
  init: function () {
    // set scale mode
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;
  },

  preload: function () {
    // load here assets required for the loading screen
    this.game.load.image('preloader_bar', 'images/preloader_bar.png');
  },

  create: function () {
    this.game.state.start('preloader');
  }
};


var PreloaderScene = {
  preload: function () {
    this.loadingBar = this.game.add.sprite(0, 240, 'preloader_bar');
    this.loadingBar.anchor.setTo(0, 0.5);
    this.load.setPreloadSprite(this.loadingBar);

    // load maps
    ['00', '01'].forEach((x) => {
      this.game.load.tilemap(`map:${x}`, `data/area${x}.json`, null,
        Phaser.Tilemap.TILED_JSON);
    });

    // load images
    this.game.load.image('background', 'images/background.png');
    this.game.load.image('chara', 'images/chara.png');
    this.game.load.image('tileset', 'images/tileset.png');
    this.game.load.image('hud', 'images/hud.png');
    this.game.load.spritesheet('slime', 'images/slime.png', 48, 48);

    // load audio
    this.game.load.audio('sfx:walk', 'audio/walk.wav');
  },

  create: function () {
    this.game.state.start('play', true, false, {
      key: 'map:00', col: 2, row: 7});
  }
};


window.onload = function () {
  var game = new Phaser.Game(768, 768, Phaser.AUTO, 'game');

  game.state.add('boot', BootScene);
  game.state.add('preloader', PreloaderScene);
  game.state.add('play', PlayScene);

  game.state.start('boot');
};

},{"./play_scene.js":4}],3:[function(require,module,exports){
function Map(game, key) {
  // create & setup map
  this.map = game.add.tilemap(key);
  this.map.addTilesetImage('tileset', 'tileset');
  this.layers = {
    background: this.map.createLayer('background'),
    obstacles: this.map.createLayer('walls'),
    triggers: this._makeTriggersLayer()
  };
}

Map.prototype.spawnEnemies = function (group) {
  const Slime = require('./slime.js');

  this.map.objects.features.forEach((obj) => {
    // NOTE: Tiled considers objects to have the anchor at 0, 1
    let col = Math.floor(obj.x / Map.TSIZE);
    let row = Math.floor(obj.y / Map.TSIZE) - 1;

    switch (obj.type) {
    case 'slime':
      group.add(new Slime(this.map.game, col, row));
      break;
    }
  });
};

Map.prototype.canMoveCharacter = function (col, row) {
  return this.map.getTile(col, row, this.layers.obstacles) === null;
};

Map.prototype.getExit = function (col, row) {
  let tile = this.map.getTile(col, row, this.layers.triggers);

  if (tile && tile.properties.type === 'exit') {
    return {
      to: tile.properties.name,
      col: col === 0 ? Map.COLS - 1 : (col >= Map.COLS - 1 ? 0 : col),
      row: row === 0 ? Map.ROWS - 1 : (row >= Map.ROWS - 1 ? 0 : row)
    };
  }
  else {
    return null;
  }
};

Map.prototype._makeTriggersLayer = function () {
  let layer = this.map.createBlankLayer('triggers', Map.COLS, Map.ROWS,
    Map.TSIZE, Map.TSIZE);

  this.map.objects.triggers.forEach((obj) => {
    // NOTE: Tiled considers objects to have the anchor at 0, 1
    let tile = this.map.putTileWorldXY(obj.gid, obj.x, obj.y - Map.TSIZE,
      obj.width, obj.height, layer);
    tile.properties.name = obj.name;
    tile.properties.type = obj.type;
  });

  layer.visible = false;
  return layer;
}

Map.TSIZE = 48;
Map.COLS = 16;
Map.ROWS = 13;

module.exports = Map;

},{"./slime.js":5}],4:[function(require,module,exports){
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
};

PlayScene.update = function () {
}

PlayScene._nextTurn = function () {
  let state = {
    chara: this.chara,
    map: this.map,
    enemies: this.enemies
  };

  this.enemies.forEach((enemy) => enemy.act(state));
  console.log('next turn');
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
    if (this.exit) console.log(col, row, '->', this.exit);
  }
};

PlayScene._getObjectAt = function (col, row) {
  return utils.getObjectAt(col, row, {enemies: this.enemies});
};

module.exports = PlayScene;

},{"./character.js":1,"./map.js":3,"./slime.js":5,"./utils.js":6}],5:[function(require,module,exports){
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

},{"./map.js":3,"./utils.js":6}],6:[function(require,module,exports){
module.exports = {
  getDistance(obj, other) {
    return {
      cols: other.col - obj.col,
      rows: other.row - obj.row
    };
  },

  getObjectAt(col, row, state) {
    let found = null;

    state.enemies.forEachAlive((enemy) => {
      if (enemy.col === col && enemy.row === row) {
        found = enemy;
      }
    });

    return found;
  }
}

},{}]},{},[2]);
