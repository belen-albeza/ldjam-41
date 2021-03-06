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
    ['00', '01', '02'].forEach((x) => {
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
    this.game.load.audio('sfx:gameover', 'audio/death.wav');
    this.game.load.audio('bgm:main', ['audio/princess.mp3', 'audio/princess.ogg']);
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
