// 常量
var STAGE_WIDTH = 800,
  STAGE_HEIGHT = 500,
  STAGE_DOM_ID = 'stage',

  POSSIBLE_POINT_LINE_NUMBER = [1,2], // 每个点上可能含有的线的条数
  POINT_NUMBER = 15,  // Stage 上点的个数
  POINT_MIN_GAP = 20, // Stage 上两点之间的最小距离

  LINE_COLOR = 'blue', // 线条颜色
  NORMAL_POINT_COLOR = 'blue', // 普通交点的颜色
  START_POINT_COLOR = 'red', // 起始点的颜色
  RSU_POINT_COLOR = 'purple', // RSU 点的颜色
  END_POINT_COLOR = 'yellow'; // 找到的终点的颜色






// 全局变量
var stage,
  stageBGLayer;

stage = new Kinetic.Stage({
  width: STAGE_WIDTH,
  height: STAGE_HEIGHT,
  container: STAGE_DOM_ID
});
stageBGLayer = new Kinetic.Layer();



// 生成图形算法：
// 在 Stage 上画一个个正文形的网（网中每个小正方形的边长是POINT_MIN_GAP）
// 从而产生了很多交点，从这些交点中选取 POINT_NUMBER 个，并随机在它们之间生成连线（注意不要重复生成两点之间的连线）

// 点
var allPoints = _.sample(genNetPoints(STAGE_WIDTH, STAGE_HEIGHT, POINT_MIN_GAP), POINT_NUMBER);

// 线
var allLines = genPointLines(allPoints);


// 生成图形
function getStartPoint() {
  return _.find(allPoints, function(p) {
    return p.circle.fill() === START_POINT_COLOR;
  });
}
function getAllRSUPoint() {
  return _.filter(allPoints, function(p) {
    return p.circle.fill() === RSU_POINT_COLOR;
  });
}


function drawBG(bgLayer, lines, points) {
  _.forEach(lines, function(line) {
    bgLayer.add(new Kinetic.Line({
      points: [line.start.x, line.start.y, line.end.x, line.end.y],
      stroke: LINE_COLOR
    }));
  });

  var clickOnCircle = function() {
    if (this.fill() === NORMAL_POINT_COLOR) {
      this.fill(RSU_POINT_COLOR);
    } else if (this.fill() === RSU_POINT_COLOR) {
      // 把其它的起点清除，只保证有一个起点
      var s = getStartPoint();
      if (s) {
        s.circle.fill(NORMAL_POINT_COLOR);
        s.circle.draw();
      }
      this.fill(START_POINT_COLOR);
    } else {
      this.fill(NORMAL_POINT_COLOR);
    }
    this.draw();
  };

  _.forEach(points, function(point) {
    var circle = new Kinetic.Circle({
      fill: NORMAL_POINT_COLOR,
      radius: 5,
      x: point.x,
      y: point.y,
      listening: true
    });
    point.circle = circle;
    circle.on('click', clickOnCircle);
    bgLayer.add(circle);
  });

  // 随机选一半点作为RSU点
  _.each(_.sample(points, Math.round(points.length / 5)), function(p) {
    p.circle.fill(RSU_POINT_COLOR);
    p.circle.draw();
  });

  // 随机选一个点作为起点
  var c = _.sample(points).circle;
  c.fill(START_POINT_COLOR);
  c.draw();
}



drawBG(stageBGLayer, allLines, allPoints);
stage.add(stageBGLayer);

var nearRSURunning = false;
function nearRSU() {
  if (nearRSURunning) return false;

  var start = getStartPoint(),
    rsu = getAllRSUPoint();

  nearRSURunning = true;

  if (!start) {
    alert('你还没有选定起始点，你可以点击你想要的点，当它颜色变成' + START_POINT_COLOR + '时表示起点');
    return ;
  }
  if (rsu.length === 0) {
    alert('你还没有选则任何一个 RSU 点，你可以点你想要的点，当它颜色变成' + RSU_POINT_COLOR + '时表示起点')
    return ;
  }


  // 首先初始化每个点到其它各个点的权重为无限大
  var weight = {};
  var path = {};
  _.each(allPoints, function(p) {
    weight[p.name] = p === start ? 0 : Infinity;
  });

  var run = true, smallLen, smallPoint, len, begin = start;
  while (run) {
    smallLen = Infinity;
    smallPoint = null;

    _.each(begin.linePoints, function(p) {
      len = begin.len(p) + weight[begin.name];
      if (len < weight[p.name]) {
        weight[p.name] = len;
        if (len < smallLen) {
          smallPoint = p;
          smallLen = len;

          path[p.name] = [start];
          _.each(path[begin.name], function(x) {
            path[p.name].push(x);
          });
          path[p.name].push(p);
        }
      }
    });

    if (smallLen == Infinity) {
      run = false;
    }
    begin = smallPoint;
  }

  smallLen = Infinity;
  smallPoint = null;
  _.each(rsu, function(p) {
    if (weight[p.name] < smallLen) {
      smallLen = weight[p.name];
      smallPoint = p;
    }
  });

  if (!smallPoint) {
    alert('没有找到最近的 RSU');
  } else {
    var road = path[smallPoint.name], roadPoints = [];
    _.each(road, function(p) {
      roadPoints.push(p.x);
      roadPoints.push(p.y);
    });
    console.log(road, path);
    var line = new Kinetic.Line({
      points: roadPoints,
      stroke: END_POINT_COLOR
    });
    stageBGLayer.add(line);
    line.draw();

    smallPoint.circle.radius(smallPoint.circle.radius() * 2);
    smallPoint.circle.fill(END_POINT_COLOR);
    smallPoint.circle.draw();
  }
}