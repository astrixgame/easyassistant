var connection = new WebSocket("ws://192.168.5.99:34987");
var radioImage = document.getElementById("radio-image");
var radioTitle = document.getElementById("radio-title");
var radioBackBtn = document.getElementById("radio-back");
var radioNextBtn = document.getElementById("radio-next");
var radioPlayBtn = document.getElementById("radio-play");
var radioPauseBtn = document.getElementById("radio-pause");
var dateDay = document.getElementById("date-day");
var dateDate = document.getElementById("date-date");
var dateTime = document.getElementById("date-time");
var modalOverlay = document.getElementById("modal-overlay");
var modal = document.getElementById("modal");
var modalTitle = document.getElementById("modal-title");
var modalText = document.getElementById("modal-text");
var days = ["Neděle","Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota"];
var months = ["Ledna","Února","Března","Dubna","Května","Června","Července","Srpna","Zíří","Října","Listopadu","Prosince"];
var volum = 0;

connection.onerror = function() {
    modalOverlay.style.display = "block";
    modal.style.display = "block";
    modalTitle.innerHTML = "Spojení Přerušeno";
    modalText.innerHTML = "Spojení se serverem bylo přešuno, z důvodu vypnutí nebo restartování serveru.<br><br>Probíhá opakovaný pokus o nové spojení.<br><br><br>Prosím vyčkejte";
}

connection.onclose = function() {
    modalOverlay.style.display = "block";
    modal.style.display = "block";
    modalTitle.innerHTML = "Spojení Přerušeno";
    modalText.innerHTML = "Spojení se serverem bylo přešuno, z důvodu vypnutí nebo restartování serveru.<br><br>Probíhá opakovaný pokus o nové spojení.<br><br><br>Prosím vyčkejte";
};

connection.onopen = function() {
    modalOverlay.style.display = "none";

    updateDate();
    setInterval(function() {
        updateDate();
    },1000);

    connection.onmessage = function(event) {
        var data = JSON.parse(event.data);
        switch(data["module"]) {
            case "radio":
                if(data["action"] == "play") {
                    radioPlayBtn.style.display = "none";
                    radioPauseBtn.style.display = "block";
                } else if(data["action"] == "pause") {
                    radioPauseBtn.style.display = "none";
                    radioPlayBtn.style.display = "block";
                } else if(data["action"] == "volume") {
                    volum = parseFloat(data["value"]);
                    updateVolume(parseFloat(data["value"]));
                } else if(data["action"] == "change") {
                    radioImage.src = data["image"];
                    radioTitle.innerHTML = data["title"];
                }
            break;
        }
    };


    function updateDate() {
        var date = new Date();
        dateDay.innerHTML = days[date.getDay()];
        dateDate.innerHTML = date.getDate() + ". "+months[date.getMonth()]+" "+date.getFullYear();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        if(hours < 10) hours = "0"+hours;
        if(minutes < 10) minutes = "0"+minutes;
        dateTime.innerHTML = hours+":"+minutes;
    }
    
    radioBackBtn.addEventListener("click",function() {
        connection.send(JSON.stringify({ module: "radio", action: "back" }));
    });
    
    radioNextBtn.addEventListener("click",function() {
        connection.send(JSON.stringify({ module: "radio", action: "next" }));
    });
    
    radioPlayBtn.addEventListener("click",function() {
        connection.send(JSON.stringify({ module: "radio", action: "play" }));
    });
    
    radioPauseBtn.addEventListener("click",function() {
        connection.send(JSON.stringify({ module: "radio", action: "play" }));
    });
    
    TweenLite.selector = tl;
    var volume = 0;
    var speed = 500;
    var radius = 10;
    var height = 4;
    var width = 100;
    var inner = width - radius * 2;
    var stage = tp("#stage", { width: 120, height: 100 });
    var slider = {
        group: tp("#slider-group", { x: 20, y: 40 }),
        inner: tp("#slider-inner", { attr: { width: width, height: radius * 2 } }) };
    var track = {
        group: tp("#track-group", { y: radius - height / 2 }),
        inner: tp("#track-inner", { attr: { x: radius, y: 0, width: inner, height } }),
        fill: tp("#track-fill", { attr: { x: radius, y: 0, width: inner, height } }) };
    var handle = {
        group: tp("#handle-group", { y: radius }),
        inner: tp("#handle-inner", { xPercent: 50, attr: { r: radius } }) };
    var offset = getOffset(track.group);
    var bounds = offset.box;
    var dragger = new Draggable(handle.group, {
        type: "x",
        cursor: "default",
        bounds: { minX: 0, maxX: width - radius * 2 },
        trigger: slider.group,
        onPress: onPress,
        onDrag: updateSlider,
        onThrowUpdate: updateSlider,
        throwProps: true,
        overshootTolerance: 0
    });
    updateSlider();
    window.addEventListener("resize", resize);
    function onPress() {
        var x = this.pointerX - offset.left;
        var tx = handle.inner._gsTransform.x;
        var dx = tx - x + this.x + radius;
        var dt = Math.abs(dx) / speed;
        TweenLite.set(handle.group, { x });
        TweenLite.to(track.fill, dt, { scaleX: x / bounds.width });
        TweenLite.fromTo(handle.inner, dt, { x: dx }, { x: 0 });
        this.update();
        updateSlider(null, true);
    }
    function updateSlider(event, animating) {
        volume = handle.group._gsTransform.x / bounds.width;
        volume = volume < 0 ? 0 : volume > 1 ? 1 : volume;
        if(!animating) TweenLite.set(track.fill, { scaleX: volume });
        if(volum != Math.round(volume*100)/100) {
            connection.send(JSON.stringify({ module: "radio", action: "volume", value: ""+(Math.round(volume*100)/100) }));
        }
    }
    function updateVolume(vol) {
        handle.group._gsTransform.x = vol * bounds.width;
        updateSlider();
        document.getElementById("handle-group").style.transform = "matrix(1,0,0,1,"+handle.group._gsTransform.x+",10)";
    }
    function resize() {
        console.log(window.innerWidth + " - " + window.innerHeight);
        offset = getOffset(track.group);
        bounds = offset.box;
    }
    function getOffset(element) {
        var body = document.body;
        var doc = document.documentElement;
        var box = element.getBoundingClientRect();
        var scrollTop = window.pageYOffset || doc.scrollTop || body.scrollTop || 0;
        var scrollLeft = window.pageXOffset || doc.scrollLeft || body.scrollLeft || 0;
        var clientTop = doc.clientTop || body.clientTop || 0;
        var clientLeft = doc.clientLeft || body.clientLeft || 0;
        var top = box.top + scrollTop - clientTop;
        var left = box.left + scrollLeft - clientLeft;
        return { top, left, box };
    }
    function tp(target, config, context) {
        var node = (context || document).querySelector(target);
        if (node && config) TweenLite.set(node, config);
        return node;
    }
    function tl(target, config, context) {
        var nodes = (context || document).querySelectorAll(target);
        if (nodes.length && config) TweenLite.set(nodes, config);
        return Array.prototype.slice.call(nodes, 0);
    }
};