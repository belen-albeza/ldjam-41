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
  },
  makeImage: function (game, width, height, color) {
    let rect = game.make.bitmapData(width, height);
    rect.ctx.fillStyle = color;
    rect.ctx.fillRect(0, 0, width, height);
    return rect;
  }
}
