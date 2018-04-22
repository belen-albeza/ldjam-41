module.exports = {
  getDistance(obj, other) {
    return {
      cols: other.col - obj.col,
      rows: other.row - obj.row
    };
  }
}
