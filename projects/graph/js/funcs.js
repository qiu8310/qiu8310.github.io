/**
 * Created by mora on 14-6-22.
 */

CACHE.SELECTORS = {};
function $(selector) {
  if (!CACHE.SELECTORS[selector]) CACHE.SELECTORS[selector] = document.querySelector(selector);
  return CACHE.SELECTORS[selector];
}
function on(selector, type, fn) { $(selector).addEventListener(type, fn, false); }
function text(selector, msg) { $(selector).innerText = msg; }
function html(selector, msg) { $(selector).innerHTML = msg; }


function getRandomVelocity() { return C.CARS.VELOCITIES[_.random(0, C.CARS.VELOCITIES.length - 1)]; }
function getRandomRotation(run) {
  if (run) {
    return C.CARS.ALGORITHM === 'ccr_line' ? 180 : _.random(10, 170);
  } else {
    return C.CARS.ALGORITHM === 'ccr_line' ? _.sample([90, 270]) : _.random(0, 360);
  }

}


// 添加背景上的方格线
function drawBGLines(bgLayer, width, height) {
  bgLayer.add(new Kinetic.Rect({
    width: C.SCREEN.WIDTH,
    height: C.SCREEN.HEIGHT,
    fill: C.SCREEN.SCREEN_COLOR
  }));

  [width, height].forEach(function(length, index) {

    var i = 0, coord = 0, points;
    for (; coord <= length; coord += C.SCREEN.GAP, i++) {

      if (index === 0) { // 根据 width 画坚线
        points = [coord, 0, coord, height];
      } else { // 根据 height 画水平线
        points = [0, coord, width, coord];
      }

      if (i % 5) {
        bgLayer.add(new Kinetic.Line({
          points: points,
          stroke: C.SCREEN.SMALL_LINE_COLOR,
          strokeWidth: 0.5
        }));
      } else {
        bgLayer.add(new Kinetic.Line({
          points: points,
          stroke: C.SCREEN.BOLD_LINE_COLOR,
          strokeWidth: 1
        }));
      }
    }
  });
}




function drawCars(carLayer) {
  return _.map(new Array(C.CARS.NUMBER), function(item, i) {
    var x, y;
    if (C.CARS.ALGORITHM === 'ccr_line') {
      x = _.random(C.CAR.RADIUS, C.SCREEN.WIDTH - C.CAR.RADIUS);
      y = 100;
    } else {
      x = _.random(C.CAR.RADIUS, C.SCREEN.WIDTH - C.CAR.RADIUS);
      y = _.random(C.CAR.RADIUS, C.SCREEN.HEIGHT - C.CAR.RADIUS);
    }


    var car = Kinetic.getCar({
      start: i === 0,
      end: i === C.CARS.NUMBER - 1,
      x: x,
      y: y,
      radius: C.CAR.RADIUS,
      degree: getRandomRotation()
    });
    carLayer.add(car);
    return car;
  });
}

// 产生 num 个 packet
function createPackets(num) {
  if (!num) return [];

  var list = _.range(num);
  list.forEach(function(_, i) {
    list[i] = {ttl: 0};
  });
  return list;
}


function runCar(car, diffTime) {
  var s,
    d = car.getAttr('rotation') % 360,
    v = car.getAttr('velocity');
  if (!v || v == 0) {
    return ;
  }

  s = v * diffTime; // 位移
  var detaX = s * CACHE.SIN[d],
    detaY = - s * CACHE.COS[d],
    x = car.x(),
    y = car.y(),
    hw = car.width() * 0.5,
    hh = car.height() * 0.5;

  // 超过边界需要反向
  if (x + detaX < hw ||
      x + detaX > C.SCREEN.WIDTH - hw ||
      y + detaY < hh ||
      y + detaY > C.SCREEN.HEIGHT - hh
    ) {
    car.rotate(getRandomRotation(true));
    return ;
  }


  car.move({x: detaX, y: detaY});
}

// 判断两辆车能否相遇
// 能相遇就返回两车的距离
function canCarsMeet (carA, carB) {
  var xA = carA.x(), yA = carA.y(), rA = carA.width() * 0.5,
    xB = carB.x(), yB = carB.y(), rB = carB.width() * 0.5;

  var dis = rA + rB, detaX = Math.abs(xA - xB), detaY = Math.abs(yA - yB);

  if (detaX > dis || detaY > dis) return false;

  var detaDis = Math.sqrt(detaX * detaX + detaY * detaY);

  if (detaDis > dis) return false;

  return detaDis;
}

function distance (carA, carB) {
  var x = Math.abs(carA.x() - carB.x()),
    y = Math.abs(carB.y() - carA.y());
  return Math.sqrt(x * x + y * y);
}



var ALG = (function() {

  var sendMap; // 记录 x -> y 发送了数据

  function record(car, target, packetNum) {
    car.transPackets(target, packetNum);
    var id = car.id();
    sendMap[id] = sendMap[id] || [];
    sendMap[id].push(target.id());
    sendMap.receives.push(target.id()); // 接收了数据的本次就不再发送；
    return [car, target, packetNum];
  }
  function canSend(car, target, packetNum) {
    var id = target.id(), packetNum = packetNum === undefined ? 1 : packetNum;
    var carPackets = car.packet();

    if (carPackets < packetNum) return false;
    if (sendMap.receives.indexOf(car.id()) !== -1) return false;

    return !sendMap[id] || sendMap[id].indexOf(car.id()) === -1;
  }

  var funcs = {
    init: function() {
      sendMap = {receives: []};
    },

    gpsr: function(cars, startCar, endCar, TIMES) {

      var i, car, targets, id, target, dis, tmpCar, tmpDis,  rtn = [];

      for (i = 0; i < cars.length; ++i) {
        car = cars[i];

        dis = null;
        target = null;

        targets = car.canTranCars;

        // 从 targets 中选一辆距离 endCar 最近的车
        for (id in targets) {
          tmpCar = targets[id].car;
          if (!canSend(car, tmpCar, 1)) continue;
          tmpDis = distance(tmpCar, endCar);
          if (dis === null || dis > tmpDis) {
            dis = tmpDis;
            target = tmpCar;
          }
        }


        if (target) {
          rtn.push(record(car, target, 1));
        }

      }

      return rtn;
    },
    epidemic: function(cars, startCar, endCar, TIMES) {
      var i, id, car, carPacket, len = cars.length, rtn = [];
      var target, targets, targetPacket;
      for (i = 0; i < len; ++i) {
        car = cars[i];

        targets = car.canTranCars;
        for (id in targets) {
          target = targets[id].car;
          if ((target.packet() === 0 || target.isEnd) && canSend(car, target, 1)) {
            rtn.push(record(car, target, 1));
          }
        }
      }

      return rtn;
    },
    sw: function() {

    },
    ccr: function() {
      var i, id, ids, car, carPacket, len = cars.length, rtn = [];
      var target, targets, targetPacket;
      for (i = 0; i < len; ++i) {
        car = cars[i];

        target = null;
        carPacket = car.packet();

        targets = car.canTranCars;
        // 从中取出一个节点来即可
        ids = [];
        for (id in targets) {
          ids.push(id);
        }
        if (ids.length) {
          id = _.sample(ids);
          target = targets[id].car;
        }

        if (target) {
          targetPacket = target.packet();
          var mid = Math.round((targetPacket + carPacket) * 0.5);
          if (targetPacket > mid) {
            rtn.push(record(target, car, targetPacket - mid));
          } else {
            rtn.push(record(car, target, carPacket - mid));
          }
        }
      }

      return rtn;
    },

    // 取出相差最大的进行平均
    ccr_avg: function() {
      var i, id, ids, car, carPacket, len = cars.length, rtn = [];
      var target, targets, targetPacket, maxGap = 0, maxGapTarget;
      for (i = 0; i < len; ++i) {
        car = cars[i];

        maxGapTarget = target = null;
        carPacket = car.packet();

        targets = car.canTranCars;

        for (id in targets) {
          target = targets[id].car;
          targetPacket = target.packet();
          if (Math.abs(targetPacket - carPacket) > maxGap) {
            maxGap = targetPacket - carPacket;
            maxGapTarget = target;
          }
        }


        if (maxGapTarget) {
          targetPacket = maxGapTarget.packet();
          var mid = Math.round((targetPacket + carPacket) * 0.5);
          if (targetPacket > mid) {
            rtn.push(record(maxGapTarget, car, targetPacket - mid));
          } else {
            rtn.push(record(car, maxGapTarget, carPacket - mid));
          }
        }
      }

      return rtn;
    }
  };
  funcs.ccr_line = funcs.ccr;

  return funcs;
}());