(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
'use strict';

const TSIZE = require('./map.js').TSIZE;
const MAX_HEALTH = 50;

function Character(game, col, row, sfx, state) {
  Phaser.Sprite.call(this, game, 0, 0, 'chara');
  this.sfx = sfx;

  this.animations.add('idle', [0], 1);
  this.animations.add('hit', [2, 1, 1, 2, 1, 1], 12);
  this.move(col, row);

  this.health = state.health || MAX_HEALTH;
  this.animations.play('idle');

  this.wearing = {
    crown: this.game.make.sprite(12, -3, 'crown'),
    robe: this.game.make.sprite(6, 30, 'robe'),
    scepter: this.game.make.sprite(39, 12, 'scepter')
  };

  for (let key in this.wearing) {
    this.addChild(this.wearing[key]);
    this.wearing[key].visible = state.wearing.includes(key);
  }

  this.wearing.scepter.animations.add('idle', [0, 1], 2, true);
  this.wearing.scepter.play('idle');
}

Character.prototype = Object.create(Phaser.Sprite.prototype);
Character.prototype.constructor = Character;

Character.prototype.canWear = function (name) {
  return name in this.wearing;
};

Character.prototype.wear = function (name) {
  this.wearing[name].visible = true;
};

Character.prototype.isWearing = function (name) {
  return this.wearing[name].visible;
};

Character.prototype.hasFullRegalia = function () {
  for (let key in this.wearing) {
    if (!this.wearing[key].visible) { return false; }
  }

  return true;
};

Character.prototype.move = function (col, row) {
  this.x = col * TSIZE;
  this.y = row * TSIZE;
  this.col = col;
  this.row = row;
};

Character.prototype.getHit = function (amount) {
  this.animations.play('hit').onComplete.addOnce(() => {
    this.animations.play('idle');
    this.damage(amount);
  });
  this.sfx.hit.play();

  return amount;
};

Character.prototype.attack = function (enemy, dist, logger) {
  let tween = this.game.add.tween(this);
  tween.to({ x: this.x + dist.cols * TSIZE, y: this.y + dist.rows * TSIZE },
    200, Phaser.Easing.Linear.None, true, 0, 0, true);

  let attackPromise = new Promise((resolve) => {
    // avoid rounding errors
    tween.onComplete.addOnce(() => {
      this.x = this.col * TSIZE;
      this.y = this.row * TSIZE;
      this.game.tweens.remove(tween);
      resolve();
    });
  });

  let damage = enemy.getHit(this._getAttackDamage());
  logger.log(`The Princess attacked ${enemy.name} and dealt ${damage} damage.`);
  if (!enemy.alive) {
    logger.log(`${enemy.name} died!`);
  }

  return attackPromise;
};

Character.prototype._getAttackDamage = function () {
  return 15;
};

module.exports = Character;

},{"./map.js":7}],2:[function(require,module,exports){
'use strict';

const TSIZE = require('./map.js').TSIZE;

function Chest(game, col, row, data, sfx) {
  Phaser.Sprite.call(this, game, col * TSIZE, row * TSIZE, 'chest');
  this.content = data.content;
  this.id = data.id;
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
      resolve({content: this.content, id: this.id});
      this.game.tweens.remove(openTween);
      this.game.tweens.remove(fadeTween);
      this.kill();
    })
  })
};


module.exports = Chest;

},{"./map.js":7}],3:[function(require,module,exports){
'use strict';

const FONT = '20pt Patrick Hand';
const FONT_COLOR = '#fff';

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

},{}],4:[function(require,module,exports){
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

},{}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

const CustomLoader = require('./loader.js');
const PlayScene = require('./play_scene.js');
const TitleScene = require('./title_scene.js');
const utils = require('./utils.js');

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

    // load maps
    ['00', '01'].forEach((x) => {
      this.game.load.tilemap(`map:${x}`, `data/area${x}.json`, null,
        Phaser.Tilemap.TILED_JSON);
    });

    // load images
    this.game.load.image('title', 'images/title.png');
    this.game.load.image('title:empty', 'images/title_empty.png');
    this.game.load.image('princess', 'images/princess.png');
    this.game.load.image('background', 'images/background.png');
    this.game.load.image('tileset', 'images/tileset.png');
    this.game.load.image('hud:logger', 'images/hud.png');
    this.game.load.image('hud:status', 'images/status.png');
    this.game.load.image('throne', 'images/door.png');
    this.game.load.image('crown', 'images/crown.png');
    this.game.load.image('robe', 'images/robe.png');
    this.game.load.spritesheet('chest', 'images/chest.png', 48, 48);
    this.game.load.spritesheet('scepter', 'images/scepter.png', 9, 27);
    this.game.load.spritesheet('chara', 'images/chara.png', 48, 48);
    this.game.load.spritesheet('slime', 'images/slime.png', 48, 48);

    // load audio
    this.game.load.audio('sfx:walk', 'audio/walk.wav');
    this.game.load.audio('sfx:hit', 'audio/hit.wav');
    this.game.load.audio('sfx:chest', 'audio/chest.wav');
  },

  create: function () {
    // this.game.state.start('play', true, false, {
    //   mapKey: 'map:00',
    //   character: {
    //     col: 4,
    //     row: 1,
    //     wearing: []
    //   },
    //   isFirstTime: true,
    //   pickedUp: []
    // });

    this.game.state.start('title', true, false, {});
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

},{"./loader.js":4,"./play_scene.js":8,"./title_scene.js":11,"./utils.js":12}],7:[function(require,module,exports){
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

Map.prototype.spawnEnemies = function (group, sfx) {
  const Slime = require('./slime.js');

  this.map.objects.features.forEach((obj) => {
    // NOTE: Tiled considers objects to have the anchor at 0, 1
    let col = Math.floor(obj.x / Map.TSIZE);
    let row = Math.floor(obj.y / Map.TSIZE) - 1;

    switch (obj.type) {
    case 'slime':
      group.add(new Slime(this.map.game, col, row, sfx));
      break;
    }
  });
};

Map.prototype.spawnItems = function (group, sfx, pickedUp) {
  // const isWearable = (name) => name in ['crown', 'scepter', 'robe'];
  const Chest = require('./chest.js');

  this.map.objects.features.forEach((obj) => {
    // NOTE: Tiled considers objects to have the anchor at 0, 1
    let col = Math.floor(obj.x / Map.TSIZE);
    let row = Math.floor(obj.y / Map.TSIZE) - 1;

    if (!pickedUp.includes(`${col}:${row}`)) {
      switch(obj.type) {
      case 'item':
        group.add(new Chest(this.map.game, col, row,
          {content: obj.name, id: `${col}:${row}`}, sfx));
        break;
      case 'throne':
        let door = group.create(col * Map.TSIZE, row * Map.TSIZE, 'throne');
        door.col = col;
        door.row = row;
        door.isThrone = true;
        break;
      }
    }
  });
}

Map.prototype.canMoveCharacter = function (col, row) {
  return this.map.getTile(col, row, this.layers.obstacles) === null;
};

Map.prototype.getExit = function (col, row) {
  let tile = this.map.getTile(col, row, this.layers.triggers);

  if (tile && tile.properties.type === 'exit') {
    return tile.properties.name === 'throne'
    ? {isVictory: true}
    : {
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
Map.ROWS = 12;

module.exports = Map;

},{"./chest.js":2,"./slime.js":9}],8:[function(require,module,exports){
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
    chest: this.game.add.audio('sfx:chest')
  };

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
    let tween = this.game.add.tween(this.chara);
    tween.to({alpha: 0, y: this.chara.y - 128}, 1000, Phaser.Easing.Sinusoidal.In, true);
    tween.onComplete.addOnce(() => {
      this.game.tweens.remove(tween);
      // go to title screen
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
  }

  // game logic
  this.isTurnReady = true;
  this.pickedUp = this.initialState.pickedUp || [];
};

PlayScene.update = function () {
}

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

  this.lifebar.setValue(this.chara.health);

  Promise.all(promises)
  .then(() => {
    this.lifebar.setValue(this.chara.health);
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

},{"./character.js":1,"./lifebar.js":3,"./logger.js":5,"./map.js":7,"./slime.js":9,"./stats.js":10,"./utils.js":12}],9:[function(require,module,exports){
const TSIZE = require('./map.js').TSIZE;
const utils = require('./utils.js');

const HEALTH = 20;
const ATTACK_DMG = 10;

function Slime(game, col, row, sfx) {
  Phaser.Sprite.call(this, game, 0, 0, 'slime');
  this.isEnemy = true;
  this.name = 'Slime';
  this.sfx = sfx;

  this.animations.add('idle', [0, 1, 2], 6, true);
  this.animations.add('hit', [3, 2, 2, 3, 2, 2], 12);
  this.animations.play('idle');

  this.health = HEALTH;

  this.move(col, row);

  this.events.onKilled.addOnce(() => {
    this.destroy();
  });
}

Slime.prototype = Object.create(Phaser.Sprite.prototype);
Slime.prototype.constructor = Slime;

Slime.prototype.move = function (col, row) {
  this.x = col * TSIZE;
  this.y = row * TSIZE;
  this.col = col;
  this.row = row;
};

Slime.prototype.act = function (state, logger) {
  return new Promise((resolve, reject) => {
    let dist = utils.getDistance(this, state.chara);

    if (this._canAttack(dist)) {
      let tween = this._attack(dist, state.chara, logger);
      tween.onComplete.addOnce(() => {
        let damage = state.chara.getHit(ATTACK_DMG, logger);
        logger.log(`${this.name} attacked and dealt ${damage} damage.`);

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

Slime.prototype.getHit = function (amount) {
  this.animations.play('hit').onComplete.addOnce(() => {
    this.animations.play('idle');
  });
  this.sfx.hit.play();

  this.damage(amount);

  return amount;
};


Slime.prototype._canAttack = function (dist) {
  // is character a 4-neighbor?
  return (dist.cols === 0 && Math.abs(dist.rows) <= 1) ||
    (dist.rows === 0 && Math.abs(dist.cols) <= 1);
}

Slime.prototype._canChase = function (dist) {
  const AREA = 3;
  return Math.abs(dist.cols) <= AREA && Math.abs(dist.rows) <= AREA;
}

Slime.prototype._attack = function (dist, chara, logger) {
  let tween = this.game.add.tween(this);
  tween.to({x: this.x + dist.cols * TSIZE, y: this.y + dist.rows * TSIZE},
     200, Phaser.Easing.Linear.None, true, 0, 0, true);

  // avoid rounding errors
  tween.onComplete.addOnce(() => {
    this.x = this.col * TSIZE;
    this.y = this.row * TSIZE;
  });

  return tween;
}

Slime.prototype._chase = function (dist, state) {
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

},{"./map.js":7,"./utils.js":12}],10:[function(require,module,exports){
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

},{"./lifebar.js":3}],11:[function(require,module,exports){
'use strict';
const TITLE_FONT = '72pt Patrick Hand';
const SMALL_FONT = '28pt Patrick Hand';
const DARK_COLOR = '#ce186a';
const SHADOW_COLOR = '#53034b';
const LIGHT_COLOR = '#fff';

const TitleScene = {};

TitleScene.init = function (data) {
  this.data = data;
};

TitleScene.create = function () {
  this.keys = this.game.input.keyboard.addKeys({
    space: Phaser.KeyCode.SPACEBAR
  });

  let titleMsg = 'Rogue Princess';
  if (this.data.isVictory) { titleMsg = 'Crowned!'; }
  if (this.data.isGameOver) { titleMsg = 'Game Over'; }

  this.game.add.image(0, 0, (this.data.isVictory || this.data.isGameOver) ?
    'title:empty' : 'title');

  let help = this.game.add.text(this.game.width / 2, this.game.height / 2 + 48,
    'Press <SPACEBAR> to start', { font: SMALL_FONT, fill: LIGHT_COLOR});
  help.anchor.setTo(0.5);
  help.setShadow(1, 1, SHADOW_COLOR, 0);

  let title = this.game.add.text(this.game.width / 2, this.game.height / 2 - 72,
    titleMsg, { font: TITLE_FONT, fill: LIGHT_COLOR});
  title.anchor.setTo(0.5);
  title.setShadow(4, 4, SHADOW_COLOR, 0);

  if (this.data.isVictory) {
    let princess = this.game.add.image(this.game.width / 2, this.game.height / 2, 'princess');
    princess.anchor.setTo(0.5);
    help.y += 200;
    title.y -= 128;
  }



  this.game.add.tween(help.scale)
    .to({x: 1.25, y: 1.25}, 1000, Phaser.Easing.Sinusoidal.InOut, true, 0, -1, true);

  this.keys.space.onUp.addOnce(() => {
    this.game.state.start('play', true, false, {
      mapKey: 'map:00',
      character: {
        col: 4,
        row: 10,
        wearing: []
      },
      isFirstTime: true,
      pickedUp: []
    });
  });
}

module.exports = TitleScene;

},{}],12:[function(require,module,exports){
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

    state.items.forEachAlive((item) => {
      if (item.col === col && item.row === row) {
        found = item;
      }
    });

    return found;
  },
  makeImage: function (game, width, height, color) {
    let rect = game.make.bitmapData(width, height);
    rect.ctx.fillStyle = color;
    rect.ctx.fillRect(0, 0, width, height);
    return rect;
  }
}

},{}]},{},[6]);
