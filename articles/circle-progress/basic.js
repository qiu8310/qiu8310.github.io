window.$ = document.querySelectorAll.bind(document);
Node.prototype.on = window.on = function (name, fn) { this.addEventListener(name, fn);};
NodeList.prototype.__proto__ = Array.prototype;
NodeList.prototype.on = NodeList.prototype.addEventListener = function (name, fn) { this.forEach(function (elem, i) { elem.on(name, fn); }); };

var controls, cp;

window.onload = function () {

    var border = 25;
    var radius = 175;
    var container = document.querySelector('.circle');

    function create() {
        if (cp && cp.root) cp.root.parentNode.removeChild(cp.root);

        cp = new CircleProgress({
            border: border,
            radius: radius,
            container: container
        });
    }

    create();


    controls = document.createElement('div');
    controls.className = 'controls';
    controls.innerHTML = '<div>' +
        '半径：<input min="50" max="175" value="' + radius + '" name="radius" type="range"/>&nbsp;&nbsp;' +
        '粗细：<input min="2" max="25" value="' + border + '" name="border" type="range"/> </div>' +
        '<div><button id="reset">重置</button>' +
        '<button id="decrease-5">后退 5 点</button>' +
        '<input id="progress" type="text" />' +
        '<button id="increase-5">前进 5 点</button>' +
        '<button id="end">结束</button></div>';

    document.body.appendChild(controls);



    var input = $('input[type=text]')[0];

    input.value = cp.get();
    $('button').on('click', function (e) {
        var args = e.target.id.split('-');
        cp[args[0]](parseInt(args[1], 10));
        input.value = cp.get();
    });
    $('input[type=range]').on('change', function () {
        radius = parseInt($('[name=radius]')[0].value, 10);
        border = parseInt($('[name=border]')[0].value, 10);
        var size = (radius + border) * 2 + 'px';
        container.style.width = size;
        container.style.height = size;
        container.style.lineHeight = size;
        create();
        input.value = cp.get();
    });

    input.on('change', function (e) {
        cp.go(e.target.value);
        input.value = cp.get();
    });
};
