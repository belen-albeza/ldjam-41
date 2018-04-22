(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

const TSIZE = require('./map.js').TSIZE;
const MAX_HEALTH = 50;

function Character(game, col, row, sfx) {
  Phaser.Sprite.call(this, game, 0, 0, 'chara');
  this.sfx = sfx;

  this.animations.add('idle', [0], 1);
  this.animations.add('hit', [2, 1, 1, 2, 1, 1], 12);
  this.move(col, row);

  this.health = MAX_HEALTH;
  this.animations.play('idle');
}

Character.prototype = Object.create(Phaser.Sprite.prototype);
Character.prototype.constructor = Character;

Character.prototype.move = function (col, row) {
  this.x = col * TSIZE;
  this.y = row * TSIZE;
  this.col = col;
  this.row = row;
};

Character.prototype.hit = function (amount) {
  this.animations.play('hit').onComplete.addOnce(() => {
    this.animations.play('idle');
  });
  this.sfx.hit.play();

  this.damage(amount);
};

module.exports = Character;

},{"./map.js":5}],2:[function(require,module,exports){
'use strict';

const FONT = '20pt Patrick Hand';
const FONT_COLOR = '#ce186a';

function LifeBar(game, x, y, value) {
  Phaser.Group.call(this, game);
  this.position.setTo(x, y);

  this._maxValue = value;

  this.label = this.game.make.text(0, 0, `Life: ${value}`, {
    font: FONT,
    fill: FONT_COLOR
  });

  this.add(this.label);
}

LifeBar.prototype = Object.create(Phaser.Group.prototype);
LifeBar.prototype.constructor = LifeBar;

LifeBar.prototype.setValue = function (value) {
  this.label.setText(`Life: ${value}`);
};

module.exports = LifeBar;

},{}],3:[function(require,module,exports){
'use strict';

// We create our own custom loader class extending Phaser.Loader.
// This new loader will support webfonts
function CustomLoader(game) {
  Phaser.Loader.call(this, game);
}

CustomLoader.prototype = Object.create(Phaser.Loader.prototype);
CustomLoader.prototype.constructor = CustomLoader;

// new method to load webfonts
// this follows the structure of all of the file assets loading methods
CustomLoader.prototype.webfont = function (key, fontName, overwrite) {
  if (typeof overwrite === 'undefined') { overwrite = false; }

  // here fontName will be stored in file's `url` property
  // after being added to the file list
  this.addToFileList('webfont', key, fontName);
  return this;
};

CustomLoader.prototype.loadFile = function (file) {
  Phaser.Loader.prototype.loadFile.call(this, file);

  // we need to call asyncComplete once the file has loaded
  if (file.type === 'webfont') {
    var _this = this;
    // note: file.url contains font name
    var font = new FontFaceObserver(file.url);
    font.load(null, 10000).then(function () {
      _this.asyncComplete(file);
    }, function () {
      _this.asyncComplete(file, 'Error loading font ' + file.url);
    });
  }
};

module.exports = CustomLoader;

},{}],4:[function(require,module,exports){
'use strict';

const CustomLoader = require('./loader.js');
const PlayScene = require('./play_scene.js');
const TitleScene = require('./title_scene.js');

var BootScene = {
  init: function () {
    // set scale mode
    this.game.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
    this.game.scale.pageAlignHorizontally = true;
    this.game.scale.pageAlignVertically = true;

    // swap Phaser.Loader for our custom one
    this.game.load = new CustomLoader(this.game);
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

    // load fonts
    this.game.load.webfont('gamja', 'Patrick Hand');
    // this.game.load.webfont('fredoka', 'Fredoka One');

    // load maps
    ['00', '01'].forEach((x) => {
      this.game.load.tilemap(`map:${x}`, `data/area${x}.json`, null,
        Phaser.Tilemap.TILED_JSON);
    });

    // load images
    this.game.load.image('title', 'images/title.png');
    this.game.load.image('background', 'images/background.png');
    this.game.load.image('tileset', 'images/tileset.png');
    this.game.load.image('hud', 'images/hud.png');
    this.game.load.spritesheet('chara', 'images/chara.png', 48, 48);
    this.game.load.spritesheet('slime', 'images/slime.png', 48, 48);

    // load audio
    this.game.load.audio('sfx:walk', 'audio/walk.wav');
    this.game.load.audio('sfx:hit', 'audio/hit.wav');
  },

  create: function () {
    // this.game.state.start('play', true, false, {
    //   key: 'map:00', col: 5, row: 7});
    this.game.state.start('title');
  }
};


window.onload = function () {
  var game = new Phaser.Game(768, 768, Phaser.AUTO, 'game');

  game.state.add('boot', BootScene);
  game.state.add('preloader', PreloaderScene);
  game.state.add('title', TitleScene);
  game.state.add('play', PlayScene);

  game.state.start('boot');
};

},{"./loader.js":3,"./play_scene.js":6,"./title_scene.js":8}],5:[function(require,module,exports){
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

},{"./slime.js":7}],6:[function(require,module,exports){
'use strict';

const utils = require('./utils.js');
const Character = require('./character.js');
const Slime = require('./slime.js');
const Map = require('./map.js');
const LifeBar = require('./lifebar.js');

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
    walk: this.game.add.audio('sfx:walk'),
    hit: this.game.add.audio('sfx:hit')
  };

  // create map
  this.map = new Map(this.game, this.mapData.key);
  // create enemies
  this.enemies = this.game.add.group();
  this.map.spawnEnemies(this.enemies);

  // create main character
  this.chara = new Character(this.game, this.mapData.col, this.mapData.row, {
    hit: this.sfx.hit
  });
  this.chara.events.onKilled.addOnce(() => {
    this.game.state.start('title', true, false);
  });
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
  this.lifebar = new LifeBar(this.game, 10, 10, 100);
  this.hud.add(this.lifebar);

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

  this.lifebar.setValue(this.chara.health);

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

},{"./character.js":1,"./lifebar.js":2,"./map.js":5,"./slime.js":7,"./utils.js":9}],7:[function(require,module,exports){
const TSIZE = require('./map.js').TSIZE;
const utils = require('./utils.js');

const ATTACK_DMG = 10;

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
      let tween = this._attack(dist, state.chara);
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

Slime.prototype._attack = function (dist, chara) {
  let tween = this.game.add.tween(this);
  tween.to({x: this.x + dist.cols*TSIZE, y: this.y + dist.rows * TSIZE},
     200, Phaser.Easing.Linear.None, true, 0, 0, true);

  // avoid rounding errors
  tween.onComplete.addOnce(() => {
    this.x = this.col * TSIZE;
    this.y = this.row * TSIZE;
  });

  chara.hit(ATTACK_DMG);

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

},{"./map.js":5,"./utils.js":9}],8:[function(require,module,exports){
'use strict';
const TITLE_FONT = '72pt Patrick Hand';
const SMALL_FONT = '28pt Patrick Hand';
const DARK_COLOR = '#ce186a';
const SHADOW_COLOR = '#53034b';
const LIGHT_COLOR = '#fff';

const TitleScene = {};

TitleScene.create = function () {
  this.keys = this.game.input.keyboard.addKeys({
    space: Phaser.KeyCode.SPACEBAR
  });

  this.game.add.image(0, 0, 'title');

  let title = this.game.add.text(this.game.width / 2, this.game.height / 2 - 72,
    'Rogue Princess', { font: TITLE_FONT, fill: LIGHT_COLOR });
  title.anchor.setTo(0.5);
  title.setShadow(4, 4, SHADOW_COLOR, 0);

  let help = this.game.add.text(this.game.width / 2, this.game.height / 2 + 48,
    'Press <SPACEBAR> to start', { font: SMALL_FONT, fill: LIGHT_COLOR});
  help.anchor.setTo(0.5);
  help.setShadow(1, 1, SHADOW_COLOR, 0);

  this.game.add.tween(help.scale)
    .to({x: 1.25, y: 1.25}, 1000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);

  this.keys.space.onUp.addOnce(() => {
    this.game.state.start('play', true, false, {
      key: 'map:00', col: 5, row: 7});
  });
}

module.exports = TitleScene;

},{}],9:[function(require,module,exports){
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

},{}]},{},[4]);
