/**
 * Created by mora on 14-6-22.
 */


!function() {

  var default_opts = {
    x: C.CAR.X,
    y: C.CAR.Y,
    width: C.CAR.WIDTH,
    height: C.CAR.HEIGHT,
    color: C.CAR.COLOR,
    radius: C.CAR.RADIUS,
    draggable: C.CAR.DRAGGABLE,
    circleColor: C.CAR.CIRCLE_COLOR,
    degree: C.CAR.DEGREE
  };

  var id = 0;

  Kinetic.getCar = function(opts) {
    opts = opts || {};
    opts = _.merge(_.cloneDeep(default_opts), opts);
    var packet = createPackets(opts.start ? C.CAR.START_PACKET :  (opts.packet || 0));
    if (opts.start) {
      opts.color = C.CAR.START_CIRCLE_COLOR;
      opts.circleColor = C.CAR.START_CIRCLE_COLOR;
    } else if (opts.end) {
      opts.color = C.CAR.END_CIRCLE_COLOR;
      opts.circleColor = C.CAR.END_CIRCLE_COLOR;
    }

    var rect = new Kinetic.Rect({
      fill: opts.color,
      strokeEnabled: false,
      width: opts.width,
      height: opts.height,
      x: opts.radius,
      y: opts.radius,
      offset: {
        x: opts.width * 0.5,
        y: opts.height * 0.5
      }
    });

    var circle = new Kinetic.Circle({
      stroke: opts.circleColor,
      strokeWidth: 0.5,
      dash: [2,2],
      radius: opts.radius,
      visible: !C.CAR.HIDE_CIRCLE,
      x: opts.radius,
      y: opts.radius
    });

    var text =  new Kinetic.Text({
      fill: 'black',
      x: opts.radius,
      y: opts.radius,
      visible: !C.CAR.HIDE_TEXT,
      offset: {
        x: 0,
        y: -5
      },
      text: packet.length
    });

    var group = new Kinetic.Group({
      width: opts.radius * 2,
      height: opts.radius * 2,
      x: opts.x,
      y: opts.y,
      name: 'Car',
      id: 'car_' + (++id),
      rotation: opts.degree,
      draggable: opts.draggable,
      velocity: getRandomVelocity(),
      packet: packet,
      offset: {
        x: opts.radius,
        y: opts.radius
      }
    });

    text.offsetX(text.width() / 2);

    group.isStart = opts.start;
    group.isEnd = opts.end;
    group.add(rect).add(circle).add(text);

    return group;
  }
}();


Kinetic.Group.prototype.packet = function(val) {
  if (typeof val === 'undefined') {
    return this.getAttr('packet').length || 0;
  }
  var text = this.children[2];
  text.text(this.packet());
  text.offsetX(text.width() / 2);
}

Kinetic.Group.prototype.transPackets = function(target, packetNum) {
  if (packetNum < 0) return target.transPackets(this, 0 - packetNum);
  var packets, trans, num;

  // 移出
  packets = this.getAttr('packet');
  trans = packets.splice(0, packetNum);
  num = trans.length;
  this.packet(true);

  var isStart = this.isStart, isEnd = target.isEnd;

  // TTL + 1
  trans.forEach(function(it) {
    if (isStart && !('s' in it)) {
      it.s = TIMES;
    }
    if (isEnd && !('e' in it)) {
      it.e = TIMES;
    }
    it.ttl ++;
  });

  // 移入
  packets = target.getAttr('packet');
  packets.push.apply(packets, trans);
  target.packet(true);
}