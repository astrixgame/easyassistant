var connection = new WebSocket("ws://192.168.5.99:34987");
var controling = document.getElementById("controling");
var radioImage = document.getElementById("radio-image");
var radioTitle = document.getElementById("radio-title");
var radioBackBtn = document.getElementById("radio-back");
var radioNextBtn = document.getElementById("radio-next");
var radioPlayBtn = document.getElementById("radio-play");
var radioPauseBtn = document.getElementById("radio-pause");
var dateDay = document.getElementById("date-day");
var dateDate = document.getElementById("date-date");
var dateTime = document.getElementById("date-time");
var weather1 = document.getElementById("weather1");
var weather2 = document.getElementById("weather2");
var weather3 = document.getElementById("weather3");
var weather4 = document.getElementById("weather4");
var weather0 = document.getElementById("weather0");
var weather1temp = document.getElementById("weather-1-temperature");
var weather2temp = document.getElementById("weather-2-temperature");
var weather3temp = document.getElementById("weather-3-temperature");
var weather4temp = document.getElementById("weather-4-temperature");
var weather0temp = document.getElementById("weather-0-temperature");
var weather1icon = document.getElementById("weather-1-icon");
var weather2icon = document.getElementById("weather-2-icon");
var weather3icon = document.getElementById("weather-3-icon");
var weather4icon = document.getElementById("weather-4-icon");
var weather0icon = document.getElementById("weather-0-icon");
var weather0title = document.getElementById("weather-0-title");
var openedWeather = document.getElementById("open-weather");
var weatherTemperature = document.getElementById("weather-temperature");
var weatherFeeltemperature = document.getElementById("weather-feeltemperature");
var weatherPressure = document.getElementById("weather-pressure");
var weatherPrecip = document.getElementById("weather-precip");
var weatherHumidity = document.getElementById("weather-humidity");
var weatherClouds = document.getElementById("weather-clouds");
var weatherWindspeed = document.getElementById("weather-windspeed");
var weatherWinddir = document.getElementById("weather-winddir");
var weatherSunrise = document.getElementById("weather-sunrise");
var weatherSunset = document.getElementById("weather-sunset");
var modalOverlay = document.getElementById("modal-overlay");
var modal = document.getElementById("modal");
var modalTitle = document.getElementById("modal-title");
var modalText = document.getElementById("modal-text");
var panels = document.getElementById("panels");
var opennedPanels = document.getElementById("openned-panels");
var lxMenu1 = document.getElementById("lxMenu1");
var lxMenu2 = document.getElementById("lxMenu2");
var lxMenu3 = document.getElementById("lxMenu3");
var lxMenu1svg = document.getElementById("lxMenu1svg");
var lxMenu2svg = document.getElementById("lxMenu2svg");
var lxMenu3svg = document.getElementById("lxMenu3svg");
var days = ["Neděle","Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota"];
var months = ["Ledna","Února","Března","Dubna","Května","Června","Července","Srpna","Zíří","Října","Listopadu","Prosince"];
var weatherTimes = ["Aktuálně","Večer","Zítra","Pozítří"];
var weatherData = [
    { icon: "", temperature: 0, feeltemperature: 0, pressure: 0, precip: 0, humidity: 0, clouds: 0, windspeed: 0, winddir: 0, sunrise: 0, sunset: 0 },
    { icon: "", temperature: 0, feeltemperature: 0, pressure: 0, precip: 0, humidity: 0, clouds: 0, windspeed: 0, winddir: 0, sunrise: 0, sunset: 0 },
    { icon: "", temperature: 0, feeltemperature: 0, pressure: 0, precip: 0, humidity: 0, clouds: 0, windspeed: 0, winddir: 0, sunrise: 0, sunset: 0 },
    { icon: "", temperature: 0, feeltemperature: 0, pressure: 0, precip: 0, humidity: 0, clouds: 0, windspeed: 0, winddir: 0, sunrise: 0, sunset: 0 }
];
var volum = 0;
var lxData;
var lxAlias = {};
var opennedPanel = "";

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
    updateWeather();
    setInterval(function() {
        updateDate();
    },1000);

    connection.onmessage = function(event) {
        var data = JSON.parse(event.data);
        switch(data["module"]) {
            case "weather":
                weatherData = data["data"];
                updateWeather();
            break;
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
            case "loxone":
                if(data["type"] == "add") {
                    lxData = data["items"];
                    Object.keys(lxData.controls).forEach(async function(uuid) {
                        var icon = lxData.cats[lxData.controls[uuid].cat].image;
                        if(lxData.controls[uuid]["defaultIcon"]) {
                            icon = lxData.controls[uuid]["defaultIcon"];
                        }
                        Object.values(lxData.controls[uuid].states).forEach(function(uuid1) {
                            lxAlias[uuid1] = uuid;
                        });
                        var value = "";
                        var opennedPanelVal = "";
                        switch(lxData.controls[uuid].type) {
                            case "InfoOnlyDigital":
                                value = '<txt class="value" id="'+lxData.controls[uuid].states.active+'-value">N/A</txt>';
                                opennedPanelVal = '<div class="openned-value-item"><txt id="'+lxData.controls[uuid].states.active+'-value-open">N/A</txt></div>';
                            break;
                            case "InfoOnlyAnalog":
                                value = '<txt class="value" id="'+lxData.controls[uuid].states.value+'-value">N/A</txt>';
                                opennedPanelVal = '<div class="openned-value-item"><txt id="'+lxData.controls[uuid].states.value+'-value-open">N/A</txt></div>';
                            break;
                            case "Switch":
                                value = '<label class="switch"><input type="checkbox" id="'+lxData.controls[uuid].states.active+'-value" onchange="lxControl(this, \'Switch\')"><span class="slider"></span></label>';
                                opennedPanelVal = '<div class="openned-value-item"><label class="switch"><input type="checkbox" id="'+lxData.controls[uuid].states.active+'-value-open" onchange="lxControl(this, \'Switch\')"><span class="slider"></span></label></div>';
                            break;
                            case "TextState":
                                value = '<txt class="value" id="'+lxData.controls[uuid].states.value+'-value">N/A</txt>';
                                opennedPanelVal = '<div class="openned-value-item"><txt id="'+lxData.controls[uuid].states.value+'-value-open">N/A</txt></div>';
                            break;
                            case "Meter":
                                value = '<txt class="value">Aktuální: <txt id="'+lxData.controls[uuid].states.actual+'-value">N/A</txt><br>Celkem: <txt id="'+lxData.controls[uuid].states.total+'-value">N/A</txt></txt>';
                                opennedPanelVal = '<div class="openned-value-item">Aktuální: <txt id="'+lxData.controls[uuid].states.actual+'-value-open">N/A</txt><br>Celkem: <txt id="'+lxData.controls[uuid].states.total+'-value-open">N/A</txt></div>';
                            break;
                            case "EIBDimmer":
                                value = '<input type="range" min="0" max="100" step="1" id="'+lxData.controls[uuid].states.position+'-value" oninput="lxControl(this, \'EIBDimmer\')">';
                                opennedPanelVal = '<div class="openned-value-item"><input type="range" min="0" max="100" step="1" id="'+lxData.controls[uuid].states.position+'-value-open" oninput="lxControl(this, \'EIBDimmer\')"></div>';
                            break;
                            case "IRoomControllerV2":
                                value = '<button class="inteligentController" onclick="lxControl(this, \'IRoomControllerV2\')" id="'+uuid+'-button"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24H134.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24V256c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z"/></svg></button>';
                                opennedPanelVal = '';// ###
                            break;
                            case "PresenceDetector":
                                value = '<txt class="value" id="'+lxData.controls[uuid].states.active+'-value">N/A</txt>';
                                opennedPanelVal = '<div class="openned-value-item"><txt class="value" id="'+lxData.controls[uuid].states.active+'-value-open">N/A</txt></div>';
                            break;
                            case "TimedSwitch":
                                value = '<button class="timedswitch" onclick="lxControl(this, \'TimedSwitch\')" id="'+lxData.controls[uuid].states.deactivationDelay+'-button"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24H134.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24V256c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z"/></svg></button>';
                                opennedPanelVal = '<div class="openned-value-item"><button class="timedswitch" onclick="lxControl(this, \'TimedSwitch\')" id="'+lxData.controls[uuid].states.deactivationDelay+'-button-open"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24H134.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24V256c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z"/></svg></button></div>';
                            break;
                            case "LeftRightAnalog":
                                value = '<txt class="value" id="'+lxData.controls[uuid].states.value+'-value">N/A</txt><button class="leftbutton" onclick="lxControl(this, \'LeftRightAnalog1\')" id="'+uuid+'-button1"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg></button><button class="rightbutton" onclick="lxControl(this, \'LeftRightAnalog2\')" id="'+uuid+'-button2"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg></button>';
                                opennedPanelVal = '<div class="openned-value-item"><txt class="value" id="'+lxData.controls[uuid].states.value+'-value-open">N/A</txt><button class="leftbutton" onclick="lxControl(this, \'LeftRightAnalog1\')" id="'+uuid+'-button1-open"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg></button><button class="rightbutton" onclick="lxControl(this, \'LeftRightAnalog2\')" id="'+uuid+'-button2-open"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg></button></div>';
                            break;
                            case "Pushbutton":
                                value = '<button class="pushbutton" onclick="lxControl(this, \'Pushbutton\')" id="'+lxData.controls[uuid].states.active+'-button"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg></button>';
                                opennedPanelVal = '<div class="openned-value-item"><button class="pushbutton" onclick="lxControl(this, \'Pushbutton\')" id="'+lxData.controls[uuid].states.active+'-button-open"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg></button></div>';
                            break;
                            case "Irrigation":
                                value = '<button class="irrigation" onclick="lxControl(this, \'Irrigation\')" id="'+lxData.controls[uuid].states.rainActive+'-button"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg></button>';
                                opennedPanelVal = '<div class="openned-value-item"><button class="irrigation" onclick="lxControl(this, \'Irrigation\')" id="'+lxData.controls[uuid].states.rainActive+'-button-open"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg></button></div>';
                            break;
                            case "Intercom":
                                value = '<button class="intercom" onclick="lxControl(this, \'Intercom\')" id="'+uuid+'-button"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 576 512"><path d="M0 128C0 92.7 28.7 64 64 64H320c35.3 0 64 28.7 64 64V384c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V128zM559.1 99.8c10.4 5.6 16.9 16.4 16.9 28.2V384c0 11.8-6.5 22.6-16.9 28.2s-23 5-32.9-1.6l-96-64L416 337.1V320 192 174.9l14.2-9.5 96-64c9.8-6.5 22.4-7.2 32.9-1.6z"/></svg></button>';
                                opennedPanelVal = '';// ###
                            break;
                            case "SmokeAlarm":
                                value = '<txt class="value" id="'+lxData.controls[uuid].states.areAlarmSignalsOff+'-value">N/A</txt>';
                                opennedPanelVal = '<div class="openned-value-item"><txt id="'+lxData.controls[uuid].states.areAlarmSignalsOff+'-value-open">N/A</txt></div>';
                            break;
                            default:
                                console.log(lxData.controls[uuid].type);
                            break;
                        }
                        opennedPanelVal += '<div class="connected-objects"><txt class="connected-objects-title">Propojené Objekty</txt>';
                        if(lxData.controls[uuid].links) {
                            Object.values(lxData.controls[uuid].links).forEach(function(u) {
                                var icon = lxData.cats[lxData.controls[u].cat].image;
                                if(lxData.controls[u]["defaultIcon"]) {
                                    icon = lxData.controls[u]["defaultIcon"];
                                }
                                getSvg(icon, u+"-object-connected-svg");
                                opennedPanelVal += '<div class="connected-object" onclick="showItem(null, null, \''+u+'\')"><div class="connected-object-svg" id="'+u+'-object-connected-svg"></div><txt>'+lxData.controls[u].name+'</txt></div>';
                            });
                        }
                        opennedPanelVal += '</div>';
                        getSvg(icon,uuid+'-open-svg');
                        opennedPanels.innerHTML += '<div class="openned-item" id="'+uuid+'-showcase"><div class="item-openned-svg" id="'+uuid+'-open-svg"></div><txt class="item-open-title">'+lxData.controls[uuid].name+'</txt>'+opennedPanelVal+'</div>';
                        getSvg(icon,uuid);
                        controling.innerHTML += '<div class="panel panel-item" id="'+uuid+'" onclick="showItem(this, event)"><txt class="title">'+smallerSentence(lxData.controls[uuid].name,20)+'</txt>'+value+'</div>';
                        
                    });
                    Object.keys(lxData.rooms).forEach(async function(uuid) {
                        getSvg(lxData.rooms[uuid].image,uuid,lxData.rooms[uuid].color);
                        controling.innerHTML += '<div class="panel panel-room" id="'+uuid+'" onclick="showRoom(this)"><txt class="title">'+smallerSentence(lxData.rooms[uuid].name,20)+'</txt></div>';
                    });
                    Object.keys(lxData.cats).forEach(async function(uuid) {
                        getSvg(lxData.cats[uuid].image,uuid,lxData.cats[uuid].color);
                        controling.innerHTML += '<div class="panel panel-category" id="'+uuid+'" onclick="showCategory(this)"><txt class="title">'+smallerSentence(lxData.cats[uuid].name,20)+'</txt></div>';
                    });
                    lxMenu1svg.style.fill = "rgb(105, 195, 80)";
                    lxMenu2svg.style.fill = "rgb(206, 206, 206)";
                    lxMenu3svg.style.fill = "rgb(206, 206, 206)";
                    Object.keys(lxData.controls).forEach(function(key) {
                        document.getElementById(key).style.display = "none";
                    });
                    Object.keys(lxData.rooms).forEach(function(key) {
                        document.getElementById(key).style.display = "none";
                    });
                    Object.keys(lxData.cats).forEach(function(key) {
                        document.getElementById(key).style.display = "none";
                    });
                    Object.keys(lxData.controls).forEach(function(key) {
                        if(lxData.controls[key].isFavorite) {
                            document.getElementById(key).style.display = "block";
                        }
                    });
                } else if(data["type"] == "update") {
                    var uid = lxAlias[data["uuid"]];
                    if(lxData.controls[uid]) {
                        if(data["uuid"] == "109ba049-024b-40b2-ffff5c23eca9d419") console.log("1");
                        switch(lxData.controls[uid].type) {
                            case "InfoOnlyDigital":
                                var val = lxData.controls[uid].details.text.off;
                                var color = lxData.controls[uid].details.color.off;
                                if(data["value"] == 1) {
                                    val = lxData.controls[uid].details.text.on;
                                    color = lxData.controls[uid].details.color.on;
                                }
                                document.getElementById(data["uuid"]+"-value").innerHTML = val;
                                document.getElementById(data["uuid"]+"-value").style.color = color;
                                document.getElementById(data["uuid"]+"-value-open").innerHTML = val;
                                document.getElementById(data["uuid"]+"-value-open").style.color = color;
                            break;
                            case "InfoOnlyAnalog":
                                var val = formatNumber(lxData.controls[uid].details.format, data["value"]);
                                if(document.getElementById(data["uuid"]+"-value")) {
                                    document.getElementById(data["uuid"]+"-value").innerHTML = val;
                                }
                                if(document.getElementById(data["uuid"]+"-value-open")) {
                                    document.getElementById(data["uuid"]+"-value-open").innerHTML = val;
                                }
                            break;
                            case "Switch":
                                var val = false;
                                if(data["value"] == 1) val = true;
                                document.getElementById(data["uuid"]+"-value").checked = val;
                                document.getElementById(data["uuid"]+"-value-open").checked = val;
                            break;
                            case "TextState":
                                document.getElementById(data["uuid"]+"-value").innerHTML = data["value"];
                            break;
                            case "Meter":
                                var format = "";
                                Object.keys(lxData.controls[uid].states).forEach(function(i) {
                                    if(lxData.controls[uid].states[i] == data["uuid"]) {
                                        format = lxData.controls[uid].details[i+"Format"];
                                    }
                                });
                                document.getElementById(data["uuid"]+"-value").innerHTML = formatNumber(format, data["value"]);
                                document.getElementById(data["uuid"]+"-value-open").innerHTML = formatNumber(format, data["value"]);
                            break;
                            case "EIBDimmer":
                                document.getElementById(data["uuid"]+"-value").value = parseInt(data["value"]);
                                document.getElementById(data["uuid"]+"-value-open").value = parseInt(data["value"]);
                            break;
                            case "IRoomControllerV2":
                                
                            break;
                            case "PresenceDetector":
                                if(document.getElementById(data["uuid"]+"-value")) {
                                    var val = lxData.controls[uid].details.text.off;
                                    if(data["value"] == 1) val = lxData.controls[uid].details.text.on;
                                    document.getElementById(data["uuid"]+"-value").innerHTML = val;
                                    document.getElementById(data["uuid"]+"-value-open").innerHTML = val;
                                }
                            break;
                            case "TimedSwitch":
                                if(lxData.controls[lxAlias[data["uuid"]]].states.deactivationDelay == data["uuid"]) {
                                    if(data["value"] > 0) {
                                        document.getElementById(data["uuid"]+"-button").style.backgroundColor = "rgba(105, 195, 80, 0.3)";
                                        document.getElementById(data["uuid"]+"-button-open").style.backgroundColor = "rgba(105, 195, 80, 0.3)";
                                    } else if(document.getElementById(data["uuid"]+"-button").style.backgroundColor == "rgba(105, 195, 80, 0.3)") {
                                        document.getElementById(data["uuid"]+"-button").style.backgroundColor = "transparent";
                                        document.getElementById(data["uuid"]+"-button-open").style.backgroundColor = "transparent";
                                    }
                                }
                            break;
                            case "LeftRightAnalog":
                                if(lxData.controls[lxAlias[data["uuid"]]].states.value == data["uuid"]) {
                                    document.getElementById(data["uuid"]+"-value").innerHTML = data["value"];
                                    document.getElementById(data["uuid"]+"-value-open").innerHTML = data["value"];
                                }
                            break;
                            case "Pushbutton":
                                if(data["value"] == 1) {
                                    document.getElementById(data["uuid"]+"-button").style.backgroundColor = "rgba(105, 195, 80, 0.3)";
                                    document.getElementById(data["uuid"]+"-button-open").style.backgroundColor = "rgba(105, 195, 80, 0.3)";
                                } else if(document.getElementById(data["uuid"]+"-button").style.backgroundColor == "rgba(105, 195, 80, 0.3)") {
                                    document.getElementById(data["uuid"]+"-button").style.backgroundColor = "transparent";
                                    document.getElementById(data["uuid"]+"-button-open").style.backgroundColor = "transparent";
                                }
                            break;
                            case "Irrigation":
                                if(lxData.controls[lxAlias[data["uuid"]]].states.rainActive == data["uuid"]) {
                                    if(data["value"] == 1) {
                                        document.getElementById(uid+"-button").style.backgroundColor = "rgba(105, 195, 80, 0.3)";
                                        document.getElementById(uid+"-button-open").style.backgroundColor = "rgba(105, 195, 80, 0.3)";
                                    } else if(document.getElementById(data["uuid"]+"-button").style.backgroundColor == "rgba(105, 195, 80, 0.3)") {
                                        document.getElementById(uid+"-button").style.backgroundColor = "transparent";
                                        document.getElementById(uid+"-button-open").style.backgroundColor = "transparent";
                                    }
                                }
                            break;
                            case "Intercom":
                                
                            break;
                            case "SmokeAlarm":
                                if(lxData.controls[lxAlias[data["uuid"]]].states.areAlarmSignalsOff == data["uuid"]) {
                                    if(data["value"] == 0) {
                                        document.getElementById(data["uuid"]+"-value").innerHTML = "Vše OK";
                                        document.getElementById(data["uuid"]+"-value").style.color = "rgb(105, 195, 80)";
                                        document.getElementById(data["uuid"]+"-value-open").innerHTML = "Vše OK";
                                        document.getElementById(data["uuid"]+"-value-open").style.color = "rgb(105, 195, 80)";
                                        if(document.getElementById(lxAlias[data["uuid"]]+"-svg")) {
                                            document.getElementById(lxAlias[data["uuid"]]+"-svg").style.fill = "rgb(193, 193, 193)";
                                        }
                                    } else {
                                        document.getElementById(data["uuid"]+"-value").innerHTML = "Kouř Detekován";
                                        document.getElementById(data["uuid"]+"-value").style.color = "rgb(231, 50, 70)";
                                        document.getElementById(data["uuid"]+"-value-open").innerHTML = "Kouř Detekován";
                                        document.getElementById(data["uuid"]+"-value-open").style.color = "rgb(231, 50, 70)";
                                        if(document.getElementById(lxAlias[data["uuid"]]+"-svg")) {
                                            document.getElementById(lxAlias[data["uuid"]]+"-svg").style.fill = "rgb(231, 50, 70)";
                                        }
                                    }
                                }
                            break;
                        }
                    }
                }
            break;
        }
    };

    lxMenu1.addEventListener("click", function() {
        lxMenu1svg.style.fill = "rgb(105, 195, 80)";
        lxMenu2svg.style.fill = "rgb(206, 206, 206)";
        lxMenu3svg.style.fill = "rgb(206, 206, 206)";
        Object.keys(lxData.controls).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.rooms).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.cats).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.controls).forEach(function(key) {
            if(lxData.controls[key].isFavorite) {
                document.getElementById(key).style.display = "block";
            }
        });
    });

    lxMenu2.addEventListener("click", function() {
        lxMenu1svg.style.fill = "rgb(206, 206, 206)";
        lxMenu2svg.style.fill = "rgb(105, 195, 80)";
        lxMenu3svg.style.fill = "rgb(206, 206, 206)";
        Object.keys(lxData.controls).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.rooms).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.cats).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.rooms).forEach(function(key) {
            document.getElementById(key).style.display = "block";
        });
    });

    lxMenu3.addEventListener("click", function() {
        lxMenu1svg.style.fill = "rgb(206, 206, 206)";
        lxMenu2svg.style.fill = "rgb(206, 206, 206)";
        lxMenu3svg.style.fill = "rgb(105, 195, 80)";
        Object.keys(lxData.controls).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.rooms).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.cats).forEach(function(key) {
            document.getElementById(key).style.display = "none";
        });
        Object.keys(lxData.cats).forEach(function(key) {
            document.getElementById(key).style.display = "block";
        });
    });

    async function getSvg(imageUrl, key, color) {
        await $.get("assets/images/"+imageUrl, function(data) {
            var t = document.getElementById(key);
            var colorSet = "";
            if(color) {
                colorSet = ' style="fill:'+color+';"';
            }
            t.innerHTML = XMLToString(data).replace('<svg ','<svg id="'+key+'-svg"'+colorSet+' ') + t.innerHTML;
        });
    }
    
    function XMLToString(oXML) {
        if(window.ActiveXObject) {
            return oXML.xml;
        } else {
            return (new XMLSerializer()).serializeToString(oXML);
        }
    }

    function formatNumber(format, number) {
        var tens = parseInt(format.substring(format.lastIndexOf(".")+1, format.lastIndexOf("f")));
        var roundInNumber = 10 ** tens;
        return format.replace("%."+tens+"f",Math.round(number * roundInNumber) / roundInNumber).replace("%%","%");
    }

    function smallerSentence(sentence, maxLength) {
        if(sentence.length <= maxLength) return sentence;
        var smallSentence = sentence.substr(0, maxLength);
        var lastSpaceIndex = smallSentence.lastIndexOf(' ');
        if(lastSpaceIndex !== -1) smallSentence = smallSentence.substr(0, lastSpaceIndex);
        smallSentence += '...';
        return smallSentence;
    }

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


    weather1.addEventListener("click", function() {
        openWeather(1);
    });

    weather2.addEventListener("click", function() {
        openWeather(2);
    });

    weather3.addEventListener("click", function() {
        openWeather(3);
    });

    weather4.addEventListener("click", function() {
        openWeather(4);
    });

    weather0.addEventListener("click", function() {
        closeWeather();
    });

    function openWeather(id) {
        var dt = weatherData[id-1];
        weather1.style.display = "none";
        weather2.style.display = "none";
        weather3.style.display = "none";
        weather4.style.display = "none";
        openedWeather.style.display = "block";
        weather0icon.innerHTML = dt["icon"];
        weather0title.innerHTML = weatherTimes[id-1];
        weather0temp.innerHTML = dt["temperature"];
        weatherTemperature.innerHTML = dt["temperature"];
        weatherFeeltemperature.innerHTML = dt["feeltemperature"];
        weatherPressure.innerHTML = dt["pressure"];
        weatherPrecip.innerHTML = dt["precip"];
        weatherHumidity.innerHTML = dt["humidity"];
        weatherClouds.innerHTML = dt["clouds"];
        weatherWindspeed.innerHTML = dt["windspeed"];
        weatherWinddir.innerHTML = dt["winddir"];
        weatherSunrise.innerHTML = dt["sunrise"];
        weatherSunset.innerHTML = dt["sunset"];
    }

    function closeWeather() {
        weather1.style.display = "block";
        weather2.style.display = "block";
        weather3.style.display = "block";
        weather4.style.display = "block";
        openedWeather.style.display = "none";
    }
    
    function updateWeather() {
        weather1icon.innerHTML = weatherData[0]["icon"];
        weather1temp.innerHTML = weatherData[0]["temperature"];
        weather2icon.innerHTML = weatherData[1]["icon"];
        weather2temp.innerHTML = weatherData[1]["temperature"];
        weather3icon.innerHTML = weatherData[2]["icon"];
        weather3temp.innerHTML = weatherData[2]["temperature"];
        weather4icon.innerHTML = weatherData[3]["icon"];
        weather4temp.innerHTML = weatherData[3]["temperature"];
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

function lxControl(element, type) {
    var uuid = lxAlias[element.id.replace("-value-open","").replace("-value","")];
    switch(type) {
        case "Switch":
            var sw;
            if(element.checked) sw = uuid+"/on"; else sw = uuid+"/off";
            connection.send(JSON.stringify({ module: "loxone", action: "resend", value: "jdev/sps/io/"+sw }))
        break;
        case "EIBDimmer":
            connection.send(JSON.stringify({ module: "loxone", action: "resend", value: "jdev/sps/io/"+uuid+"/"+element.value+".000000" }));
        break;
    }
}
                    
function showItem(element, event, uuid) {
    if(event != null) {
        if(event.target.nodeName != "BUTTON" && event.target.nodeName != "SPAN" && event.target.nodeName != "INPUT") {
            if(event.target.nodeName == "SVG") {
                if(event.target.id.includes("-svg")) {
                    show();
                }
            } else {
                show();
            }
            if(event.target.nodeName == "path") {
                if(event.target.ownerSVGElement.id.includes("-svg")) {
                    show();
                }
            } else {
                show();
            }
        }
    } else show();

    function show() {
        if(element != null) {
            opennedPanel = element.id;
        } else {
            document.getElementById(opennedPanel+"-showcase").style.display = "none";
            opennedPanel = uuid;
        }
        document.getElementById("lxMenuBack").style.display = "block";
        document.getElementById(opennedPanel+"-showcase").style.display = "block";
        document.getElementById("p-menu").style.borderBottom = "2px solid rgba(0, 0, 0, 0.1)";
        document.getElementById("controling").style.display = "none";
        lxMenu1.style.display = "none";
        lxMenu2.style.display = "none";
        lxMenu3.style.display = "none";
    }
}

function closeOpnened() {
    document.getElementById("lxMenuBack").style.display = "none";
    document.getElementById("p-menu").style.borderBottom = "none";
    document.getElementById("controling").style.display = "block";
    lxMenu1.style.display = "block";
    lxMenu2.style.display = "block";
    lxMenu3.style.display = "block";
    document.getElementById(opennedPanel+"-showcase").style.display = "none";
}

function showRoom(element) {
    Object.keys(lxData.rooms).forEach(function(key) {
        document.getElementById(key).style.display = "none";
    });
    Object.keys(lxData.controls).forEach(function(key) {
        if(lxData.controls[key].room == element.id) {
            document.getElementById(key).style.display = "block";
        }
    });
}

function showCategory(element) {
    Object.keys(lxData.cats).forEach(function(key) {
        document.getElementById(key).style.display = "none";
    });
    Object.keys(lxData.controls).forEach(function(key) {
        if(lxData.controls[key].cat == element.id) {
            document.getElementById(key).style.display = "block";
        }
    });
}