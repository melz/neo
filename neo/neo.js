'use strict';

var Neo = function() {};

Neo.version = "0.4.1";

Neo.painter;
Neo.fullScreen = false;

Neo.config = {
    width: 300,
    height: 300,

    colors: [ 
        "#000000", "#FFFFFF",
        "#B47575", "#888888",
        "#FA9696", "#C096C0",
        "#FFB6FF", "#8080FF",
        "#25C7C9", "#E7E58D",
        "#E7962D", "#99CB7B",
        "#FCECE2", "#F9DDCF"
    ],
};

Neo.SLIDERTYPE_NONE = 0;
Neo.SLIDERTYPE_RED = 1;
Neo.SLIDERTYPE_GREEN = 2;
Neo.SLIDERTYPE_BLUE = 3;
Neo.SLIDERTYPE_ALPHA = 4;
Neo.SLIDERTYPE_SIZE = 5;


Neo.init = function() {
    Neo.createContainer();
    sssl(["assets/jquery-1.4.2.min.js",
          "assets/painter.js",
          "assets/tools.js",
          "assets/commands.js",
          "assets/widgets.js"], function() { Neo.init2(); });
};

Neo.init2 = function() {
    var pair = location.search.substring(1).split('&');
    for (var i = 0; pair[i]; i++) {
        var tmp = pair[i].split('=');
        Neo.config[tmp[0]] = tmp[1];
    }
    Neo.config.width = parseInt(Neo.config.width);
    Neo.config.height = parseInt(Neo.config.height);

    Neo.canvas = document.getElementById("canvas");
    Neo.container = document.getElementById("container");
    Neo.toolsWrapper = document.getElementById("toolsWrapper");

    Neo.painter = new Neo.Painter();
    Neo.painter.build(Neo.canvas, Neo.config.width, Neo.config.height);
    Neo.canvas.oncontextmenu = function() {return false;};
//  Neo.painter.onUpdateCanvas = null;

    Neo.resizeCanvas();

    Neo.initComponents();
    Neo.initButtons();
    Neo.container.style.visibility = "visible";
}

Neo.initComponents = function() {
//  var toolSet = document.getElementById("toolSet");
//  document.getElementById("tools").appendChild(toolSet);
    document.getElementById("copyright").innerHTML += "v" + Neo.version;

    //お絵描き中はアプレットのborderを選択状態にする
    var container = document.getElementById("container");
    container.addEventListener("mousedown", function(e) {
        container.style.borderColor = '#800000';
        e.stopPropagation();
    }, false);
    document.addEventListener("mousedown", function(e) {
        container.style.borderColor = 'transparent';
    }, false);

    //画面外の何もないところををクリックして描画されてしまうのをちょっと防ぐ
    document.getElementById("toolSet")['data-ui'] = true;
    document.getElementById("toolPad")['data-ui'] = true;
}

Neo.initButtons = function() {
    new Neo.Button().init("undo").onmouseup = function() {
        new Neo.UndoCommand(Neo.painter).execute();
    };
    new Neo.Button().init("redo").onmouseup = function () {
        new Neo.RedoCommand(Neo.painter).execute();
    };
    new Neo.Button().init("window").onmouseup = function() {
        new Neo.WindowCommand(Neo.painter).execute();
    };
    new Neo.Button().init("submit").onmouseup = function() {
        new Neo.SubmitCommand(Neo.painter).execute();
    };
    new Neo.Button().init("copyright").onmouseup = function() {
        new Neo.CopyrightCommand(Neo.painter).execute();
    };
    new Neo.Button().init("zoomPlus").onmouseup = function() {
        new Neo.ZoomPlusCommand(Neo.painter).execute();
    };
    new Neo.Button().init("zoomMinus").onmouseup = function() {
        new Neo.ZoomMinusCommand(Neo.painter).execute();
    };

    Neo.fillButton = new Neo.Button().init("fill", {type:'fill'});

    // toolTip
    Neo.penTip = new Neo.PenTip().init("pen", {type:'pen'});
    Neo.eraserTip = new Neo.EraserTip().init("eraser", {type:'eraser'});
    Neo.copyTip = new Neo.CopyTip().init("copy", {type:'copy'});
    Neo.maskTip = new Neo.MaskTip().init("mask", {type:'mask'});

    Neo.toolButtons = [Neo.fillButton, Neo.penTip, Neo.eraserTip, Neo.copyTip];

    // colorTip
    for (var i = 1; i <= 14; i++) {
        new Neo.ColorTip().init("color" + i, {index:i});
    };
    
    // colorSlider
    Neo.sliders[Neo.SLIDERTYPE_RED] = new Neo.ColorSlider().init(
        "sliderRed", {type:Neo.SLIDERTYPE_RED});
    Neo.sliders[Neo.SLIDERTYPE_GREEN] = new Neo.ColorSlider().init(
        "sliderGreen", {type:Neo.SLIDERTYPE_GREEN});
    Neo.sliders[Neo.SLIDERTYPE_BLUE] = new Neo.ColorSlider().init(
        "sliderBlue", {type:Neo.SLIDERTYPE_BLUE});
    Neo.sliders[Neo.SLIDERTYPE_ALPHA] = new Neo.ColorSlider().init(
        "sliderAlpha", {type:Neo.SLIDERTYPE_ALPHA});

    // sizeSlider
    Neo.sliders[Neo.SLIDERTYPE_SIZE] = new Neo.SizeSlider().init(
        "sliderSize", {type:Neo.SLIDERTYPE_SIZE});

    new Neo.LayerControl().init("layerControl");
};

/*
-----------------------------------------------------------------------
色が変わった時の対応
-----------------------------------------------------------------------
*/

Neo.updateUIColor = function(updateSlider, updateColorTip) {
    var color = Neo.painter.foregroundColor;

    Neo.sliders[Neo.SLIDERTYPE_SIZE].update();
    Neo.penTip.update();
    
    if (updateSlider) {
        Neo.sliders[Neo.SLIDERTYPE_RED].update();
        Neo.sliders[Neo.SLIDERTYPE_GREEN].update();
        Neo.sliders[Neo.SLIDERTYPE_BLUE].update();
    }

    if (updateColorTip) {
        var colorTip = Neo.ColorTip.getCurrent();
        if (colorTip) colorTip.setColor(color);
    }
};

/*
-----------------------------------------------------------------------
リサイズ対応
-----------------------------------------------------------------------
*/

Neo.updateWindow = function() {
    if (Neo.fullScreen) {
        document.getElementById("windowView").style.display = "block";
        document.getElementById("windowView").appendChild(Neo.container);

    } else {
        document.getElementById("windowView").style.display = "none";
        document.getElementById("pageView").appendChild(Neo.container);
    }
    Neo.resizeCanvas();
};

Neo.resizeCanvas = function() {
    var appletWidth = Neo.container.clientWidth;
    var appletHeight = Neo.container.clientHeight;

    var width0 = Neo.painter.canvasWidth * Neo.painter.zoom;
    var height0 = Neo.painter.canvasHeight * Neo.painter.zoom;

    var width = (width0 < appletWidth - 100) ? width0 : appletWidth - 100;
    var height = (height0 < appletHeight - 120) ? height0 : appletHeight - 120;

    Neo.painter.destWidth = width;
    Neo.painter.destHeight = height;

    Neo.painter.destCanvas.width = width;
    Neo.painter.destCanvas.height = height;
    Neo.painter.destCanvasCtx = Neo.painter.destCanvas.getContext("2d");
    Neo.painter.destCanvasCtx.imageSmoothingEnabled = false;
    Neo.painter.destCanvasCtx.mozImageSmoothingEnabled = false;

    Neo.canvas.style.width = width + "px";
    Neo.canvas.style.height = height + "px";
    Neo.toolsWrapper.style.height = Neo.container.clientHeight + "px";
    
    Neo.painter.setZoom(Neo.painter.zoom);
    Neo.painter.updateDestCanvas();
};

/*
-----------------------------------------------------------------------
投稿
-----------------------------------------------------------------------
*/

Neo.getSizeString = function(len) {
    var result = String(len);
    while (result.length < 8) {
        result = "0" + result;
    }
    return result;
};

Neo.openURL = function(url) {
    require('electron').shell.openExternal(url);
};

Neo.submit = function(board, blob) {
    var url = "http://" + board + "/paintpost.php";
    var header = new Blob();

    var headerLength = this.getSizeString(header.size);
    var imgLength = this.getSizeString(blob.size);
    var body = new Blob(['P', // PaintBBS
                         headerLength,
                         header,
                         imgLength,
                         '\r\n', 
                         blob], {type: 'blob'});

    if (1) {
        // xhrで直接送信する場合
        var request = new XMLHttpRequest();
        request.open("POST", url, true);
        request.onload = function (e) {
            console.log(request.response);

            var exitURL = "http://" + board + "/futaba.php?mode=paintcom";
            location.href = exitURL;
        }
        request.send(body);

    } else {
        // node経由で送信する場合
        var arrayBuffer;
        var fileReader = new FileReader();
        fileReader.onload = function() {
            arrayBuffer = this.result;
            var dataView = new DataView(arrayBuffer);

            var headers = { 
                'Content-Type': 'application/octet-stream',
                'User-Agent': 'PaintBBS/2.x'
            };
            var options = {
                url: url,
                method: 'POST',
                headers: headers,
                body: new Uint8Array(arrayBuffer),
            }

            var request = require('request');
            request(options, function(error, response, body) {
                if (body) console.log(body);

                var exitURL = "http://" + board + "/futaba.php?mode=paintcom";
                Neo.openURL(exitURL);
            });
        };
        fileReader.readAsArrayBuffer(body);
    }
};


//simple, small script loader
//https://gist.github.com/aFarkas/936413
(function(){
	var firstScript = document.getElementsByTagName('script')[0];
	var scriptHead = firstScript.parentNode;
	var re = /ded|co/;
	var onload = 'onload';
	var onreadystatechange = 'onreadystatechange'; 
	var readyState = 'readyState';
	
	var load = function(src, fn){
		var script = document.createElement('script');
		script[onload] = script[onreadystatechange] = function(){
			if(!this[readyState] || re.test(this[readyState])){
				script[onload] = script[onreadystatechange] = null;
				fn && fn(script);
				script = null;
			}
		};
		script.async = true;
		script.src = src;
		scriptHead.insertBefore(script, firstScript);
	};
	window.sssl = function(srces, fn){
		if(typeof srces == 'string'){
			load(srces, fn);
			return;
		}
		var src = srces.shift();
		load(src, function(){
			if(srces.length){
				window.sssl(srces, fn);
			} else {
				fn && fn();
			}
		});
	};
})();

/*
-----------------------------------------------------------------------
DOMツリーの作成
-----------------------------------------------------------------------
*/

Neo.createContainer = function(div) {
    if (!div) div = document.getElementsByTagName("body")[0];
    var neo = document.createElement("div");
    neo.className = "NEO";
    neo.innerHTML = (function() {/*

<div id="pageView" style="width:450px; height:470px; margin:auto;">
    <div id="container" style="visibility:hidden;">
        <div id="center">
            <div id="painterContainer">
                <div id="painterWrapper">
                    <div id="upper">
                        <div id="redo">やり直し</div>
                        <div id="undo">元に戻す</div>
                        <div id="fill">塗り潰し</div>
                   </div>
                    <div id="painter">
                        <div id="canvas">
                            <div id="scrollH" data-ui=true></div>
                            <div id="scrollV" data-ui=true></div>
                            <div id="zoomPlusWrapper">
                                <div id="zoomPlus">+</div>
                            </div>
                            <div id="zoomMinusWrapper">
                                <div id="zoomMinus">-</div>
                            </div>
                        </div>
                    </div>
                    <div id="lower">
                    </div>
                </div>
                <div id="toolsWrapper">
                    <div id="tools">
                        <div id="toolSet">
                            <div id="pen" class="toolTip"><div class="label">鉛筆</div></div>
                            <div id="eraser" class="toolTip"><div class="label">消しペン</div></div>
                            <div id="copy" class="toolTip"><div class="label">コピー</div></div>
                            <div id="mask" class="toolTip"><div class="label">マスク</div></div>

                            <div class="colorTips">
                                <div id="color2"></div><div id="color1"></div><br>
                                <div id="color4"></div><div id="color3"></div><br>
                                <div id="color6"></div><div id="color5"></div><br>
                                <div id="color8"></div><div id="color7"></div><br>
                                <div id="color10"></div><div id="color9"></div><br>
                                <div id="color12"></div><div id="color11"></div><br>
                                <div id="color14"></div><div id="color13"></div>
                            </div>

                            <div id="sliderRed"></div>
                            <div id="sliderGreen"></div>
                            <div id="sliderBlue"></div>
                            <div id="sliderAlpha"></div>
                            <div id="sliderSize"></div>

                            <div class="reserveControl" style="margin-top:4px; display: none;"></div>
                            <div id="layerControl" style="margin-top:6px;"></div>
    
                            <div id="toolPad" style="height:20px;"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <div id="headerButtons">
            <div id="window">窓</div>
        </div>
        <div id="footerButtons">
            <div id="submit">投稿</div>
            <div id="copyright">(C)しいちゃん PaintBBS NEO</div>
        </div>
    </div>
</div>

<div id="windowView" style="display: none;">
</div>

*/}).toString().match(/\/\*([^]*)\*\//)[1];
    div.appendChild(neo);
};

