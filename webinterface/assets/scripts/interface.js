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
var speechRecognition_start = document.getElementById("speechRecognition");
var speechRecognition_buble = document.getElementById("speechBuble");
var speechRecognition_thread = null;
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
var jLockables = {};
var opennedPanel = "";

var audio_notification = new Audio('assets/media/notification.mp3');

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
                        if(lxData.controls[uuid].states) {
                            Object.values(lxData.controls[uuid].states).forEach(function(uuid1) {
                                lxAlias[uuid1] = uuid;
                            });
                            if(lxData.controls[uuid].subControls) {
                                Object.keys(lxData.controls[uuid].subControls).forEach(function(key) {
                                    Object.values(lxData.controls[uuid].subControls[key].states).forEach(function(ud) {
                                        lxAlias[ud] = uuid;
                                    });
                                });
                            }
                        }
                        var name = lxData.controls[uuid].name;
                        var action = lxData.controls[uuid].uuidAction;
                        var type = lxData.controls[uuid].type;
                        var room = lxData.controls[uuid].room;
                        var category = lxData.controls[uuid].cat;
                        var icon = lxData.controls[uuid].defaultIcon != "" ? lxData.controls[uuid].defaultIcon : lxData.cat[category].image;
                        var panel = "";

                        panel += '<div class="panel cControl" id="'+uuid+'" data-type="'+type+'" data-uuid-action="'+action+'" data-room="'+room+'" data-category="'+category+'">';
                        panel += '<txt class="title">'+smallerSentence(name)+'</txt>';
                        panel += '<div class="value">'+getControl(lxData.controls[uuid])+'</div>';
                        panel += '</div>';

                        controling.innerHTML += panel;
                        getSvg(icon, uuid);
                    });
                    Object.keys(lxData.rooms).forEach(async function(uuid) {
                        var name = lxData.rooms[uuid].name;
                        var icon = lxData.rooms[uuid].image;
                        var panel = "";

                        panel += '<div class="panel cRoom" id="'+uuid+'" onclick="showRoom(\''+uuid+'\')">';
                        panel += '<txt class="title">'+smallerSentence(name)+'</txt>';
                        panel += '</div>';

                        controling.innerHTML += panel;
                        getSvg(icon, uuid, "rgb(105, 195, 80)");
                    });
                    Object.keys(lxData.cats).forEach(async function(uuid) {
                        var name = lxData.cats[uuid].name;
                        var icon = lxData.cats[uuid].image;
                        var color = lxData.cats[uuid].color;
                        var panel = "";

                        panel += '<div class="panel cCategory" id="'+uuid+'" onclick="showCategory(\''+uuid+'\')">';
                        panel += '<txt class="title">'+smallerSentence(name)+'</txt>';
                        panel += '</div>';

                        controling.innerHTML += panel;
                        getSvg(icon, uuid, color);
                    });
                    function getControl(element) {
                        var res = "";
                        var jLocked = "";
                        if(element.details && element.details.jLockable) jLocked = 'data-jLocked="'+element.states.jLocked+'" ';
                        switch(element.type) {
                            case "InfoOnlyDigital":
                                res = '<p '+jLocked+'data-active="'+element.states.active+'">N/A</p>';
                            break;
                            case "InfoOnlyAnalog":
                                res = '<p '+jLocked+'data-value="'+element.states.value+'" data-error="'+element.states.error+'" data-format="'+element.details.format+'">N/A</p>';
                            break;
                            case "Switch":
                                res = '<label class="switch"><input type="checkbox" '+jLocked+'data-active="'+element.states.active+'" onchange="lxControl(this, \'Switch\')"><span class="slider"></span></label>';
                            break;
                            case "TextState":
                                res = '<p '+jLocked+'data-textAndIcon="'+element.states.textAndIcon+'" data-iconAndColor="'+element.states.iconAndColor+'">N/A</p>';
                            break;
                            case "Meter":
                                if(element.details.type == "storage")
                                    res = '<p '+jLocked+'data-storage="'+element.states.storage+'" data-storageFormat="'+element.details.storageFormat+'">N/A</p>';
                                else
                                    res = '<p '+jLocked+'data-actual="'+element.states.actual+'" data-actualFormat="'+element.details.actualFormat+'">N/A</p><p>•</p><p '+jLocked+'data-total="'+element.states.total+'" data-totalFormat="'+element.details.totalFormat+'">N/A</p>';
                            break;
                            case "EIBDimmer":
                                res = '<input type="range" data-position="'+element.states.position+'" min="0" max="100" step="0.01">';
                            break;
                            case "IRoomControllerV2":
                                
                            break;
                            case "PresenceDetector":
                                res = '<p '+jLocked+'data-active="'+element.states.active+'" data-format="'+element.details.format+'">N/A</p>';
                            break;
                            case "TimedSwitch":
                                res = '<button '+jLocked+'data-deactivationDelay="'+element.states.deactivationDelayTotal+'"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M75 75L41 41C25.9 25.9 0 36.6 0 57.9V168c0 13.3 10.7 24 24 24H134.1c21.4 0 32.1-25.9 17-41l-30.8-30.8C155 85.5 203 64 256 64c106 0 192 86 192 192s-86 192-192 192c-40.8 0-78.6-12.7-109.7-34.4c-14.5-10.1-34.4-6.6-44.6 7.9s-6.6 34.4 7.9 44.6C151.2 495 201.7 512 256 512c141.4 0 256-114.6 256-256S397.4 0 256 0C185.3 0 121.3 28.7 75 75zm181 53c-13.3 0-24 10.7-24 24V256c0 6.4 2.5 12.5 7 17l72 72c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-65-65V152c0-13.3-10.7-24-24-24z"/></svg></button>';
                            break;
                            case "LeftRightAnalog":
                                res = '<p '+jLocked+'data-value="'+element.states.value+'" data-min="'+element.details.min+'" data-max="'+element.details.max+'" data-step="'+element.details.step+'" data-format="'+element.details.format+'">N/A</p><button '+jLocked+'><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/></svg></button><button '+jLocked+'><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg></button>';
                            break;
                            case "Pushbutton":
                                res = '<button '+jLocked+'data-active="'+element.states.active+'"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg></button>';
                            break;
                            case "Irrigation":
                                res = '<p '+jLocked+'data-currentZone="'+element.states.currentZone+'">N/A</p><button '+jLocked+'data-rainActive="'+element.states.rainActive+'"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/></svg></button>';
                            break;
                            case "Intercom":
                                
                            break;
                            case "SmokeAlarm":
                                res = '<p '+jLocked+'data-areAlarmSignalsOff="'+element.states.areAlarmSignalsOff+'" data-alarmCause="'+element.states.alarmCause+'">N/A</p>';
                            break;
                            case "EnergyManager2":

                            break;
                            case "EFM":
                                
                            break;
                            case "Wallbox2":
                                res = '<p '+jLocked+'data-connected="'+element.states.connected+'">N/A</p>';
                            break;
                            case "LoadManager":
                                res = '<p '+jLocked+'data-availablePower="'+element.states.availablePower+'">N/A</p>';
                            break;
                            case "AalSmartAlarm":
                                res = '<p '+jLocked+'data-alarmLevel="'+element.states.alarmLevel+'">N/A</p>';
                            break;
                            case "Alarm":
                                res = '<p '+jLocked+'data-armed="'+element.states.armed+'" data-level="'+element.states.level+'">N/A</p>';
                            break;
                            case "AalEmergency":

                            break;
                            case "PulseAt":

                            break;
                            case "Webpage":
                                res = '<button '+jLocked+'onclick="window.open(\''+element.details.urlHd+'\', \'_blank\')"><svg xmlns="http://www.w3.org/2000/svg" height="1em" viewBox="0 0 512 512"><path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/></svg></button>';
                            break;
                            case "WindowMonitor":

                            break;
                            case "CentralLightController":

                            break;
                            case "CentralJalousie":

                            break;
                            case "ClimateController":

                            break;
                            case "CentralAudioZone":

                            break;
                            case "LightControllerV2":

                            break;
                            case "AlarmClock":

                            break;
                            case "Window":

                            break;
                            case "Jalousie":

                            break;
                            case "Gate":
                                
                            break;
                            case "Ventilation":

                            break;
                            case "Radio":

                            break;
                            case "AudioZoneV2":

                            break;
                            case "Remote":

                            break;
                            case "NfcCodeTouch":

                            break;
                            case "Sauna":

                            break;
                            default:
                                console.log(lxData.controls[uuid].type);
                            break;
                        }
                        return res;
                    }
                } else if(data["type"] == "update") {
                    var mainUuid = data["uuid"];
                    if(lxAlias[data["uuid"]]) mainUuid = lxAlias[data["uuid"]];
                    if(lxData.controls[mainUuid]) {
                        var mainElm = lxData.controls[mainUuid];
                        switch(mainElm.type) {
                            case "InfoOnlyDigital":
                                var eel = document.querySelector("[data-active='"+data["uuid"]+"']");
                                if(eel) {
                                    var valueC = data["value"] == 1 ? "on" : "off";
                                    var value = mainElm.details ? mainElm.details.text[valueC] : data["value"] == 1 ? "Aktivní" : "Neaktivní";
                                    var color = mainElm.details ? mainElm.details.color[valueC] : data["value"] == 1 ? "rgb(105, 195, 80)" : "rgba(234, 234, 245, 0.6)";
                                    if(eel.innerHTML != value) {
                                        eel.innerHTML = value;
                                        eel.style.color = color;
                                    }
                                }
                            break;
                            case "InfoOnlyAnalog":
                                var eel = document.querySelector("[data-value='"+data["uuid"]+"']");
                                if(eel) {
                                    var value = formatNumber(mainElm.details.format, data["value"]);
                                    if(eel.innerHTML != value)
                                        eel.innerHTML = value;
                                }
                            break;
                            case "Switch":
                                var eel = document.querySelector("[data-active='"+data["uuid"]+"']");
                                if(eel) {
                                    var value = data["value"] == 1 ? true : false;
                                    if(eel.checked != value)
                                        eel.checked = value;
                                }
                            break;
                            case "TextState":
                                var eel = document.querySelector("[data-textAndIcon='"+data["uuid"]+"']");
                                if(eel)
                                    if(eel.innerHTML != data["value"])
                                        eel.innerHTML = data["value"];
                            break;
                            case "Meter":
                                if(mainElm.details.type == "storage") {
                                    var eel = document.querySelector("[data-storage='"+data["uuid"]+"']");
                                    if(eel) {
                                        var text = formatNumber(mainElm.details.storageFormat, data["value"]);
                                        if(eel.innerHTML != text)
                                            eel.innerHTML = text;
                                    }
                                } else {
                                    var eel = document.querySelector("[data-actual='"+data["uuid"]+"']");
                                    if(eel) {
                                        var text = formatNumber(mainElm.details.actualFormat, data["value"]);
                                        if(eel.innerHTML != text)
                                            eel.innerHTML = text;
                                    } else {
                                        eel = document.querySelector("[data-total='"+data["uuid"]+"']");
                                        if(eel) {
                                            var text = formatNumber(mainElm.details.totalFormat, data["value"]);
                                            if(eel.innerHTML != text)
                                                eel.innerHTML = text;
                                        }
                                    }
                                }
                            break;
                            case "EIBDimmer":
                                var eel = document.querySelector("[data-position='"+data["uuid"]+"']");
                                if(eel && eel.value != data["value"])
                                    eel.value = data["value"];
                            break;
                            case "IRoomControllerV2":
                                
                            break;
                            case "PresenceDetector":
                                var eel = document.querySelector("[data-active='"+data["uuid"]+"']");
                                if(eel) {
                                    var text = data["value"] == 1 ? "Přítomnost aktivní" : "Přitomnost neaktivní";
                                    if(eel.innerHTML != text) {
                                        eel.innerHTML = text;
                                        eel.style.color = data["value"] == 1 ? "rgb(105, 195, 80)" : "rgba(234, 234, 245, 0.6)";
                                    }
                                }
                            break;
                            case "TimedSwitch":
                                var eel = document.querySelector("[data-deactivationDelay='"+data["uuid"]+"']");
                                if(eel) {
                                    var color = data["value"] > 0 ? "rgb(105, 195, 80)" : "";// Button background
                                    if(eel.style.backgroundColor != color)
                                        eel.style.backgroundColor = color;
                                } 
                            break;
                            case "LeftRightAnalog":
                                var eel = document.querySelector("[data-value='"+data["uuid"]+"']")
                                if(eel && eel.innerHTML != formatNumber(mainElm.details.format, data["value"]))
                                    eel.innerHTML = formatNumber(mainElm.details.format, data["value"]);
                            break;
                            case "Pushbutton":
                                var eel = document.querySelector("[data-active='"+data["uuid"]+"']");
                                if(eel) {
                                    var color = data["value"] == 1 ? "rgb(105, 195, 80)" : "";// Button background
                                    if(eel.style.backgroundColor != color)
                                        eel.style.backgroundColor = color;
                                } 
                            break;
                            case "Irrigation":
                                var eel = document.querySelector("[data-rainActive='"+data["uuid"]+"']");
                                if(eel) {
                                    var color = data["value"] == 1 ? "rgb(105, 195, 80)" : "";// Button background
                                    if(eel.style.backgroundColor != color)
                                        eel.style.backgroundColor = color;
                                }
                                eel = document.querySelector("[data-currentZone='"+data["uuid"]+"']");
                                if(eel)
                                    if(data["value"] != -1) {
                                        eel.innerHTML = "Ventil "+(data["value"]+1)+" aktivní";
                                        eel.style.color = "rgb(105, 195, 80)";
                                    } else {
                                        eel.innerHTML = "Vypnuto";
                                        eel.style.color = "rgba(234, 234, 245, 0.6)";
                                    }
                            break;
                            case "Intercom":
                                
                            break;
                            case "SmokeAlarm":
                                var eel = document.querySelector("[data-areAlarmSignalsOff='"+data["uuid"]+"']");
                                var titles = ["Kouřový poplach","Vodní poplach","Teplotní poplach","Obloukový (elektrický) poplach"];
                                if(eel)
                                    if(data["value"] == 1) {
                                        eel.innerHTML = "Detekován";
                                        eel.style.color = "rgb(231, 50, 70)";
                                    } else {
                                        eel.innerHTML = "Vše OK";
                                        eel.style.color = "rgb(105, 195, 80)";
                                    }
                                else {
                                    eel = document.querySelector("[data-alarmCause='"+data["uuid"]+"']");
                                    if(eel && data["value"] > 0 && eel.innerHTML != titles[data["value"]-1])
                                        eel.innerHTML = titles[data["value"]-1];
                                }
                            break;
                            case "EnergyManager2":

                            break;
                            case "EFM":

                            break;
                            case "Wallbox2":
                                var eel = document.querySelector("[data-connected='"+data["uuid"]+"']");
                                if(eel) {
                                    var text = data["value"] == 1 ? "Vozidlo připojeno" : "Vozidlo odpojeno";
                                    var color = data["value"] == 1 ? "rgb(105, 195, 80)" : "rgba(234, 234, 245, 0.6)";
                                    if(eel.innerHTML != text) {
                                        eel.innerHTML = text;
                                        eel.style.color = color;
                                    }
                                }
                            break;
                            case "LoadManager":
                                var eel = document.querySelector("[data-availablePower='"+data["uuid"]+"']");
                                if(eel && eel.innerHTML != data["value"] + "kW k dispozici") {
                                    eel.innerHTML = data["value"] + " kW k dispozici";
                                    if(data["value"] > 2)
                                        eel.style.color = "rgb(105, 195, 80)";
                                    else
                                        eel.style.color = "rgb(231, 50, 70)";
                                }
                                    
                            break;
                            case "AalSmartAlarm":
                                var eel = document.querySelector("[data-alarmLevel='"+data["uuid"]+"']");
                                var titles = ["Okamžitý poplach","Zpožděný poplach"];
                                if(eel)
                                    if(data["value"] > 0 && eel.innerHTML != titles[data["value"]-1]) {
                                        eel.innerHTML = titles[data["value"]-1];
                                        eel.style.color = "rgb(231, 50, 70)";
                                        audio_notification.play();
                                    } else {
                                        eel.innerHTML = "Vše OK";
                                        eel.style.color = "rgb(105, 195, 80)";
                                    }
                            break;
                            case "Alarm":
                                var eel = document.querySelector("[data-armed='"+data["uuid"]+"']");
                                var titles = ["Tichý poplach","Akustický poplach","Optický poplach","Vnitřní poplach","Venkovní poplach","Vzdálený poplach"];
                                if(eel)
                                    if(data["value"] == 0 && eel.innerHTML != "Odstřeženo") {
                                        eel.innerHTML = "Odstřeženo";
                                        eel.style.color = "rgba(234, 234, 245, 0.6)";
                                    } else if(data["value"] == 1 && eel.innerHTML == "Odstřeženo") {
                                        eel.innerHTML = "Zastřeženo";
                                        eel.style.color = "rgb(105, 195, 80)";
                                    }
                                else {
                                    eel = document.querySelector("[data-level='"+data["uuid"]+"']");
                                    if(eel) {
                                        if(data["value"] > 0 && titles[data["value"]-1] != eel.innerHTML) {
                                            eel.innerHTML = titles[data["value"]-1];
                                            eel.style.color = "rgb(231, 50, 70)";
                                            audio_notification.play();
                                        }
                                    }
                                }
                            break;
                            case "AalEmergency":

                            break;
                            case "PulseAt":

                            break;
                            case "Webpage":
                                // No events
                            break;
                            case "WindowMonitor":

                            break;
                            case "CentralLightController":

                            break;
                            case "CentralJalousie":

                            break;
                            case "ClimateController":

                            break;
                            case "CentralAudioZone":

                            break;
                            case "LightControllerV2":

                            break;
                            case "AlarmClock":

                            break;
                            case "Window":

                            break;
                            case "Jalousie":

                            break;
                            case "Gate":
                                
                            break;
                            case "Ventilation":

                            break;
                            case "Radio":

                            break;
                            case "AudioZoneV2":

                            break;
                            case "Remote":

                            break;
                            case "NfcCodeTouch":

                            break;
                            case "Sauna":

                            break;
                        }
                    }
                } else if(data["type"] == "response") {

                }
            break;
        }
    };

    if("webkitSpeechRecognition" in window) {
        var SpeechRecognition = SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition_thread = new SpeechRecognition();
        speechRecognition_thread.continuous = false;
        speechRecognition_thread.lang = "cs-CZ";
        speechRecognition_thread.interimResults = false;
        speechRecognition_thread.onstart = function() {
            speechRecognition_buble.style.opacity = "1";
        }
        speechRecognition_thread.onerror = function(mes) {
            alert(JSON.stringify(mes));
        }
        speechRecognition_thread.onresult = function(event) {
            var current = event.resultIndex;
            var transcript = event.results[current][0].transcript;
            speechRecognition_buble.style.opacity = "1";
            speechRecognition_buble.innerHTML = transcript;
            setTimeout(function() {
                speechRecognition_buble.style.opacity = "0";
            }, 3000);
            connection.send(JSON.stringify({ module: "speech", sentence: transcript }));
        }
        speechRecognition_start.addEventListener("click", function() {
            speechRecognition_thread.start();
        });
    } else {
        alert("No Speech");
        console.warn("Speech Recognition is not supported in your browser!");
    }
    
    lxMenu1.addEventListener("click", function() {
        lxMenu1svg.style.fill = "rgb(105, 195, 80)";
        lxMenu2svg.style.fill = "rgb(206, 206, 206)";
        lxMenu3svg.style.fill = "rgb(206, 206, 206)";
        document.querySelectorAll('.cControl').forEach(element => {
            element.style.display = 'none';
        });
        Object.keys(lxData.controls).forEach(function(key) {
            if(lxData.controls[key].isFavorite && document.getElementById(key))
                document.getElementById(key).style.display = "block";
        });
        document.querySelectorAll('.cRoom').forEach(element => {
            element.style.display = 'none';
        });
        document.querySelectorAll('.cCategory').forEach(element => {
            element.style.display = 'none';
        });
    });

    lxMenu2.addEventListener("click", function() {
        lxMenu1svg.style.fill = "rgb(206, 206, 206)";
        lxMenu2svg.style.fill = "rgb(105, 195, 80)";
        lxMenu3svg.style.fill = "rgb(206, 206, 206)";
        document.querySelectorAll('.cControl').forEach(element => {
            element.style.display = 'none';
        });
        document.querySelectorAll('.cRoom').forEach(element => {
            if(document.querySelectorAll("[data-room='"+element.id+"']").length != 0)
                element.style.display = 'block';
        });
        document.querySelectorAll('.cCategory').forEach(element => {
            element.style.display = 'none';
        });
    });

    lxMenu3.addEventListener("click", function() {
        lxMenu1svg.style.fill = "rgb(206, 206, 206)";
        lxMenu2svg.style.fill = "rgb(206, 206, 206)";
        lxMenu3svg.style.fill = "rgb(105, 195, 80)";
        document.querySelectorAll('.cControl').forEach(element => {
            element.style.display = 'none';
        });
        document.querySelectorAll('.cRoom').forEach(element => {
            element.style.display = 'none';
        });
        document.querySelectorAll('.cCategory').forEach(element => {
            if(document.querySelectorAll("[data-category='"+element.id+"']").length != 0)
                element.style.display = 'block';
        });
    });

    async function getSvg(imageUrl, key, color) {
        if(imageUrl && imageUrl != "") await $.get("assets/images/"+imageUrl, function(data) {
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
            connection.send(JSON.stringify({ module: "loxone", action: "resend", value: "jdev/sps/io/"+sw }));
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

function showRoom(uuid) {
    document.querySelectorAll(".cRoom").forEach(function(room) {
        room.style.display = "none";
    });
    Object.values(document.querySelectorAll("[data-room='"+uuid+"']")).forEach(function(control) {
        if(control.style)
            control.style.display = "block";
    });
}

function showCategory(uuid) {
    document.querySelectorAll(".cCategory").forEach(function(category) {
        category.style.display = "none";
    });
    Object.values(document.querySelectorAll("[data-category='"+uuid+"']")).forEach(function(control) {
        if(control.style)
            control.style.display = "block";
    });
}//console.log(arr[data["uuid"]] + " --> " + data["value"]);