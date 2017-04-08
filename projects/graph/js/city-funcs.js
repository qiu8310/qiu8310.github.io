/**
 * 点类
 * @param x
 * @param y
 * @constructor
 */
var _k = 1;
var _lenCache = {};
var Point = function(x, y) {
  this.name = 'p_' + _k;
  _k++;

  this.x = x;
  this.y = y;
  this.lineNumber = 0; // 点上有0条线
  this.linePoints = []; // 与此点相连的其它所有点集合
};
Point.prototype = {
  equal: function (point) {
    return point.x === this.x && point.y === this.y;
  },
  lt: function(point) {
    return this.x < point.x || (this.x === point.x && this.y < point.y);
  },
  gt: function(point) {
    return !this.lt(point);
  },
  len: function(point) {
    var key = [this.x, this.y, point.x, point.y].join('_');
    if (!(key in _lenCache)) {
      _lenCache[key] = Math.round(Math.pow(Math.pow(this.y - point.y, 2) + Math.pow(this.x - point.x, 2),.5));
    }
    return _lenCache[key];
  },
  hasLinePoint: function(point) {
    return _.some(this.linePoints, function(p) { return p.equal(point); });
  },
  addLinePoint: function(point) {
    if (!this.hasLinePoint(point)) {
      this.linePoints.push(point);
      this.lineNumber ++;
      point.linePoints.push(this);
      point.lineNumber ++;
    }
  }
};

/**
 * 线，没有方向之分
 * @param start
 * @param end
 * @constructor
 */
var Line = function(start, end) {
  // 每次都把 x、y 都小的点当作 start，不能出现 start 和 end 相等的情况
  if (start.equal(end)) {
    throw new Error('Line 的起始点不应该相等');
  }
  var reverse = start.gt(end);

  this.start = reverse ? end : start;
  this.end = reverse ? start : end;
  //this.length = Math.round(Math.pow(Math.pow(end.y - start.y, 2) + Math.pow(end.x - start.x, 2),.5));
  this.start.addLinePoint(this.end);
};

Line.prototype = {
  equal: function(line) {
    return line.start.equal(this.start) && line.end.equal(this.end);
  }
};




// 生成一个个正方形的网，返回上面所有的点
function genNetPoints(width, height, netSize){
  var xLength = Math.floor(width / netSize),
    yLength = Math.floor(height / netSize),
    x, y, result = [];

  for (x = 1; x < xLength - 1; x++) {
    for (y = 1; y < yLength - 1; y++) {
      result.push(new Point(x * netSize, y * netSize));
    }
  }
  return result;
}


// 在点与点之间随机连线
function genPointLines(points) {
  var lines = [],
    possiblePointLineNumber = POSSIBLE_POINT_LINE_NUMBER;  // 每个点上可能有的线的个数

  if (points.length < _.max(possiblePointLineNumber)) {
    throw new Error('点的数量太少了，不足以生成线');
  }

  _.forEach(points, function(point) {
    var pointLineNum = _.sample(possiblePointLineNumber),
      randomPoint,
      line;
    while (point.lineNumber < pointLineNum) {
      randomPoint = _.sample(points);
      if (point === randomPoint || point.hasLinePoint(randomPoint)) {
        continue;
      }
      line = new Line(randomPoint, point);
      lines.push(line);
    }
  });

  return lines;

}


function getPointExcept(points, point) {
  return _.filter(points, function(p) { return p !== point; });
}