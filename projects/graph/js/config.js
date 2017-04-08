// 1px = 10m

var C = {
  SCREEN: {
    WIDTH: 600,
    HEIGHT: 400,
    GAP: 10,
    SCREEN_COLOR: '#FFFFFF',
    SMALL_LINE_COLOR: '#F5F5F5',
    BOLD_LINE_COLOR: '#EAEAEA'
  },

  CAR: {
    DRAGGABLE: true,
    COLOR: 'green',   // 车身的颜色
    START_COLOR: 'blue',  // 起始车颜色
    END_COLOR: 'red',     // 目标车颜色
    X: 10,            // 默认车的 X 坐标
    Y: 10,            // 默认车的 Y 坐标
    WIDTH: 2,         // 默认车的 宽度
    HEIGHT: 4,        // 默认车的 高度
    RADIUS: 30,       // 默认车外边的圆圈的半径，用来表示车辆可传输的距离
    HIDE_CIRCLE: false, // 是否隐藏最外圆圈
    HIDE_TEXT: false,   // 隐藏文本
    START_PACKET: 1024, // 起始车辆的数据包数量，发完了就没了
    CIRCLE_COLOR: 'rgba(99, 99, 99, .5)',   // 车外边圆圈的颜色
    START_CIRCLE_COLOR: 'blue',
    END_CIRCLE_COLOR: 'red',
    DEGREE: 0         // 车的运动方向 0 - 360
  },

  CARS: {
    ALGORITHM: 'gpsr',
    NUMBER: 20,
    VELOCITIES: [0, 10, 20, 30, 50, 60, 80, 120, 180] // 车可能的速度 (m/s)
  }
};



var CACHE = (function(){
  var CACHE = {SIN:[], COS:[]};
  // cache degree
  var deg;
  for (var i = 0; i <= 360; i++) {
    deg = i * Math.PI / 180;
    CACHE.SIN[i] = Math.sin(deg);
    CACHE.COS[i] = Math.cos(deg);
  }

  return CACHE;
})();



// 配置相关
!function(){

  var elements = [].slice.call(document.querySelectorAll('[data-key]'));

  function config(key, val) {
    var keys = key.toUpperCase().split('.');
    var def_val = C[keys[0]][keys[1]],
      def_val_type = typeof def_val,
      parse_val,
      rtn_val;

    val = val.trim();

    if (def_val_type === 'number') {
      parse_val = parseInt(val, 10);
      if (isNaN(parse_val)) parse_val = def_val;

    } else if (def_val_type === 'boolean') {
      parse_val = val - 1 === 0 ? true : false;
      rtn_val = parse_val ? '1' : '0';

    } else if (def_val_type === 'object') {
      // 数组
      parse_val = val.replace(/[^\d,]/g, '').split(',');
      if (parse_val[0] === '') parse_val = def_val;

      rtn_val = parse_val.join(',');

    } else {
      parse_val = val.trim();
      if (parse_val === '') parse_val = def_val;
    }

    C[keys[0]][keys[1]] = parse_val;

    return rtn_val === undefined ? parse_val : rtn_val;
  }




  window.configReset = function() {
    elements.forEach(function(ele) {
      var key = ele.dataset.key, val = ele.value;

      var rtn_val = config(key, val);

      ele.value = rtn_val;

    });
  }

}();
