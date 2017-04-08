var stage = new Kinetic.Stage({
                                container: 'container'
                              });


var carLayer, cars, startCar, endCar, lines, animation, TIMES;


function compute() {
  cars.forEach(function(car) {
    car.canTranCars = {};
  });

  cars.forEach(function(car, index) {

    var target, dis, targetPacket;
    for (var i = index + 1; i < cars.length; ++i) {
      target = cars[i];

      dis = canCarsMeet(car, target);

      // 目标车只收数据，不发出数据
      // 开始车只发数据，不收数据
      if (dis) {
        if (car !== endCar && target !== startCar) {
          car.canTranCars[target.id()] = {
            car: target,
            distance: dis
          }
        }
        if (target !== endCar && car !== startCar) {
          target.canTranCars[car.id()] = {
            car: car,
            distance: dis
          }
        }

      }

    }

  });

  ALG.init();
  return ALG[C.CARS.ALGORITHM](cars, startCar, endCar, TIMES);
}


function init() {
  configReset();
  [].slice.call(document.querySelectorAll('#labels .label')).forEach(function(node) {
    node.innerHTML = 0;
  });

  // stage
  stage.destroyChildren();
  stage.width(C.SCREEN.WIDTH);
  stage.height(C.SCREEN.HEIGHT);

  // 背景图层 和 车辆图层
  var bgLayer = new Kinetic.Layer();
  carLayer = new Kinetic.Layer();

  drawBGLines(bgLayer, C.SCREEN.WIDTH, C.SCREEN.HEIGHT);
  cars = drawCars(carLayer);

  cars.forEach(function(car) {
    if (car.isStart) {
      startCar = car;
    } else if (car.isEnd) {
      endCar = car;
    }
  });

  // 动画
  TIMES = 0;
  animation && animation.stop();
  animation = new Kinetic.Animation(function(frame) {
    var t = frame.timeDiff / 1000;

    // TODO 计算线条是否超出范围
    if (lines) {
      lines.forEach(function(l) { l && l.destroy(); });
    }
    lines = [];

    // 计算
    if (Math.round(frame.time / 1000) === TIMES) {


      // 记录当前频率
      TIMES && text('#labels .fps', frame.frameRate.toFixed(2));
      TIMES++;
      text('#labels .times', TIMES);

      var tranGroup = compute() || [];

      // 画线
      tranGroup.forEach(function(data) {
        if (data.length !== 3) return ;

        var src = data[0], dest = data[1], packet = data[2];

        line = new Kinetic.Line({
                                  points: [src.x(), src.y(), dest.x(), dest.y()],
                                  stroke: 'red',
                                  strokeWidth: 6,
                                  lineCap: 'round',
                                  lineJoin: 'round'
                                });


        lines.push(line);
        carLayer.add(line);
      });

      var sendPacket = C.CAR.START_PACKET - startCar.packet(),
        receivePacket = endCar.packet();

      var packets = endCar.getAttr('packet'), e2e = 0, ttl = 0;
      text('#labels .send', sendPacket);
      text('#labels .receive', receivePacket);
      if (sendPacket > 0) {
        text('#labels .rate', (receivePacket/sendPacket).toFixed(2));
      }
      if (receivePacket > 0) {
        packets.forEach(function(p) {
          e2e += p.e - p.s;
          ttl += p.ttl;
        });
        text('#labels .e2e', (e2e / receivePacket).toFixed(2));
        text('#labels .ttl', (ttl / receivePacket).toFixed(2));
      }
    }


    // 动画
    cars.forEach(function(car) {
      runCar(car, t);
    });


  }, carLayer);


  // 添加图层
  stage.add(bgLayer).add(carLayer);
}


init();










