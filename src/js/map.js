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

Map.prototype.spawnItems = function (group, sfx) {
  // const isWearable = (name) => name in ['crown', 'scepter', 'robe'];
  const Chest = require('./chest.js');

  this.map.objects.features.forEach((obj) => {
    // NOTE: Tiled considers objects to have the anchor at 0, 1
    let col = Math.floor(obj.x / Map.TSIZE);
    let row = Math.floor(obj.y / Map.TSIZE) - 1;

    switch(obj.type) {
    case 'item':
      group.add(new Chest(this.map.game, col, row, obj.name, sfx));
      break;
    }
  })
}

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
Map.ROWS = 12;

module.exports = Map;
