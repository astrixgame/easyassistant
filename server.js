import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import LxCommunicator from "LxCommunicator";
import axios from 'axios';
import fs from 'fs';
import natural from 'natural';
import chalk from 'chalk';
import readline, { clearScreenDown } from 'readline';

log("INFO","Main Thread","Initializing varriables");

var clients = new Set();
var conf = {};
var weatherReadData = {};
var controlControlsIds = {};
var controlRoomsIds = {};
var controlCatsIds = {};
var lxAlias = {};
var lxData = {};
var idSeed = 1;
var controlValues = {};
var sentenceMapping = [];
var lxNamesAlias = {
    "1a4da4f3-00c7-f5b8-ffff5c23eca9d419": "žárovka žárovku lustr",
    "1a4da4fd-02f6-fdf0-ffffb6ede515692f": "žárovka žárovku lustr teplota"
};

log("INFO","Main Thread","Varriables has been inilialized");
log("INFO","Main Thread","Loading configurations files");

if(fs.existsSync("config.json")) {
    fs.readFile("config.json", {encoding: 'utf-8'}, function(err,data) {
        conf = JSON.parse(data);
    
        log("INFO","Main Thread","Configurations files has been loaded");
        log("INFO","Main Thread","Loading server cache and data files");
    
        fs.readFile("weather.json", {encoding: 'utf-8'}, function(err, weatherDataReaded) {
            weatherReadData = JSON.parse(weatherDataReaded);
    
            log("INFO","Main Thread","Server cache and data files has been loaded");
            log("INFO","Loxone Thread","Trying to establish connection with Loxone Miniserver");
    
            loxoneConnection(conf["loxoneAddr"], conf["loxoneUser"], conf["loxonePass"]);
        });
    });
} else {
    log("WARNING","Main Thread","You doesn't configure it yet, you must rename the config.sample.json to config.json and edit it for your use");
    process.exit(1);
}

function loxoneConnection(lxAddr, lxUser, lxPass) {
    var WebSocketConfig = LxCommunicator.WebSocketConfig;
    var config = new WebSocketConfig(WebSocketConfig.protocol.WS,"a466678a-200a-4c8b-beb4-cce31a9b56a4","EasyAssistant",WebSocketConfig.permission.APP,false);
        
    log("INFO","Loxone Thread","Trying to create listeners for receiving");
    config.delegate = {
        socketOnDataProgress: function socketOnDataProgress(socket, progress) {},
        socketOnEventReceived: function socketOnEventReceived(socket, events, type) {
            switch(type) {
                case 2:
                    events.forEach(function(event) {
                        controlValues[event.uuid] = event.value;
                        sendValues(event.uuid, event.value);
                    });
                break;
                case 3:
                    events.forEach(function(event) {
                        controlValues[event.uuid] = event.text;
                        sendValues(event.uuid, event.text);
                    });
                break;
            }
        }
    };

    function sendValues(uuid, value) {
        if(lxData.controls[lxAlias[uuid]]) {
            var mainItem = lxData.controls[lxAlias[uuid]];
            var myUuid = controlControlsIds[lxAlias[uuid]];
            switch(mainItem.type) {
                case "InfoOnlyDigital":
                    if(mainItem.states.active == uuid) {
                        var val = "";
                        var col = "";
                        if(mainItem.details) {
                            if(mainItem.details.text)
                                val = value == 0 ? mainItem.details.text.off : mainItem.details.text.on;
                            else
                                val = value == 0 ? "Vypnuto" : "Zapnuto";
                            if(mainItem.details.color)
                                col = value == 0 ? mainItem.details.color.off : mainItem.details.color.on;
                            else
                                col = value == 0 ? "rgb(231, 50, 70)" : "rgb(105, 195, 80)";
                        } else {
                            val = value == 0 ? "Vypnuto" : "Zapnuto";
                            col = value == 0 ? "rgb(231, 50, 70)" : "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "value", value: val, color: col }));
                    }
                break;
                case "InfoOnlyAnalog":
                    if(mainItem.states.value == uuid) {
                        var val = value.toString();
                        if(mainItem.details && mainItem.details.format)
                            val = formatNumber(mainItem.details.format, value);
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "value", value: val }));
                    }
                break;
                case "Switch":
                    if(mainItem.states.active == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "value", value: value == 0 ? false : true }));
                break;
                case "TextState":
                    if(mainItem.states.textAndIcon == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "value", value: value }))
                break;
                case "Meter":
                    if(mainItem.details.type)
                        switch(mainItem.details.type) {
                            case "storage":
                                if(mainItem.states.actual == uuid) {
                                    var val = "";
                                    var col = "rgba(234, 234, 245, 0.6)";
                                    if(value != 0) {
                                        val = value < 0 ? " • Nabíjení "+formatNumber(mainItem.details.actualFormat, value) : " • Dodávání "+formatNumber(mainItem.details.actualFormat, value);
                                        col = value < 0 ? "rgb(105, 195, 80)" : "rgb(247, 181, 92)";
                                    }
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "actual", value: val, color: col }));
                                }
                                if(mainItem.states.storage == uuid)
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "storage", value: formatNumber(mainItem.details.storageFormat, value) }));
                            break;
                            case "unidirectional":
                                if(mainItem.states.actual == uuid)
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "actual", value: formatNumber(mainItem.details.actualFormat, value), color: Math.round(value) == 0 ? "rgba(234, 234, 245, 0.6)" : "rgb(105, 195, 80)" }));
                                if(mainItem.states.total == uuid)
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "total", value: " • "+formatNumber(mainItem.details.totalFormat, value) }));
                            break;
                            case "bidirectional":
                                if(mainItem.states.actual == uuid) {
                                    var col = "rgba(234, 234, 245, 0.6)";
                                    if(value != 0) col = value < 0 ? "rgb(105, 195, 80)" : "rgb(247, 181, 92)";
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "actual", value: formatNumber(mainItem.details.actualFormat, value), color: col }));
                                }
                            break;
                        }
                    else {
                        if(mainItem.states.actual == uuid)
                            sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "actual", value: formatNumber(mainItem.details.actualFormat, value) }));
                        if(mainItem.states.total == uuid)
                            sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "total", value: " • "+formatNumber(mainItem.details.totalFormat, value) }));
                    }
                break;
                case "EIBDimmer":
                    if(mainItem.states.position == uuid) {
                        var val = value+"%";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value > 0)
                            col = "rgb(105, 195, 80)";
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "dimmer", value: val, color: col }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "dimmersw", value: value > 0 ? true : false }));
                    }
                break;
                case "IRoomControllerV2":
                    if(mainItem.states.activeMode == uuid) {
                        var val = "";
                        Object.keys(mainItem.details.timerModes).forEach(function(i) {
                            if(mainItem.details.timerModes[i].id == value) {
                                val = mainItem.details.timerModes[i].name;
                            }
                        });
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "activemode", value: val, color: "rgb(105, 195, 80)" }));
                    }
                break;
                case "PresenceDetector":
                    if(mainItem.states.active == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "active", value: value == 0 ? "Bez přítomnosti" : "Přítomnost aktivní", color: value == 0 ? "rgba(234, 234, 245, 0.6)" : "rgb(105, 195, 80)" }));
                break;
                case "TimedSwitch":
                    // No Update Required
                break;
                case "LeftRightAnalog":
                    if(mainItem.states.value) {
                        var val = "";
                        var min = mainItem.details.min;
                        var max = mainItem.details.max;
                        var step = mainItem.details.step;
                        if(value - step >= min) {
                            val = (value - step)+" • ";
                        }
                        val += "<strong>"+value+"</strong>";
                        if(value + step <= max) {
                            val += " • "+(value + step);
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "value", value: val }));
                    }
                break;
                case "Pushbutton":
                    // No Update Required
                break;
                case "Irrigation":
                    if(mainItem.states.currentZone == uuid) {
                        var val = "Vypnuto";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value != -1) {
                            val = "Ventil "+(value+1)+" aktivní";
                            col = "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "currentzone", value: val, color: col }));
                    }
                break;
                case "SmokeAlarm":
                    if(mainItem.states.level == uuid) {
                        var val = "Vše OK";
                        var col = "rgb(105, 195, 80)";
                        if(value > 0) {
                            if(controlValues[mainItem.states.timeServiceMode] > 0) {
                                val = "Servisní režim aktivní";
                                col = "rgb(247, 181, 92)";
                            } else {
                                val = "Alarm aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            if(controlValues[mainItem.states.timeServiceMode] > 0) {
                                val = "Servisní režim aktivní";
                                col = "rgb(247, 181, 92)";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "level", value: val, color: col }));
                    }
                    if(mainItem.states.timeServiceMode == uuid) {
                        var val = "Vše OK";
                        var col = "rgb(105, 195, 80)";
                        if(controlValues[mainItem.states.level] > 0) {
                            if(value > 0) {
                                val = "Servisní režim aktivní";
                                col = "rgb(247, 181, 92)";
                            } else {
                                val = "Alarm aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            if(value > 0) {
                                val = "Servisní režim aktivní";
                                col = "rgb(247, 181, 92)";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "level", value: val, color: col }));
                    }
                break;
                case "EnergyManager2":
                    if(mainItem.states.Gpwr == uuid) {
                        var val = "";
                        var col = "";
                        if(value >= 0) {
                            val = "100% Vlastní spotřeba";
                            col = "rgb(105, 195, 80)";
                        } else {
                            val = kwtow(value)+" ze sítě";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "status", value: val, color: col }));
                    }
                break;
                case "EFM":
                    if(mainItem.states.Ppwr == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "grid", value: value > 0 ? " • Vlastní: "+kwtow(value) : "", color: "rgb(105, 195, 80)" }));
                    if(mainItem.states.Spwr == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "storage", value: "Bat: "+kwtow(value), color: "rgb(105, 195, 80)" }));
                break;
                case "Wallbox2":
                    switch(mainItem.details.type) {
                        case "unidirectional":
                            if(mainItem.states.connected == uuid) {
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "connected", value: value == 0 ? "Vozidlo odpojeno" : "Vozidlo připojeno", color: value == 0 ? "rgba(234, 234, 245, 0.6)" : "rgb(105, 195, 80)" }));
                            }
                            if(mainItem.states.enabled == uuid)
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "enabled", value: value == 0 ? "Nabíjení pozastaveno • " : "Nabíjení • " }));
                        break;
                    }
                break;
                case "LoadManager":
                    if(mainItem.states.availablePower == uuid) {
                        var val = "";
                        var col = "";
                        if(value > 0) {
                            val = value+" kW k dispozici";
                            col = "rgb(105, 195, 80)";
                        } else {
                            val = value+" kW k dispozici";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "available", value: val, color: col }));
                    }
                break;
                case "AalSmartAlarm":
                    var levels = ["Okamžitý","Opožděný"];
                    if(mainItem.states.disableEndTime == uuid) {
                        var val = "Vše OK";
                        var col = "rgb(105, 195, 80)";
                        if(value == 0) {
                            if(controlValues[mainItem.states.alarmLevel] != 0) {
                                val = levels[controlValues[mainItem.states.alarmLevel]-1]+" poplach aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            val = "Neaktivní";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "alarm", value: val, color: col }));
                    }
                    if(mainItem.states.alarmLevel == uuid) {
                        var val = "Vše OK";
                        var col = "rgb(105, 195, 80)";
                        if(controlValues[mainItem.states.disableEndTime] == 0) {
                            if(value != 0) {
                                val = levels[value-1]+" poplach aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            val = "Neaktivní";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "alarm", value: val, color: col }));
                    }
                break;
                case "Alarm":
                    var levels = ["I • Tichý","II • Akustický","III • Optický","IV • Vnitřní","V • Venkovní","VI • Dálkový"];
                    if(mainItem.states.level == uuid) {
                        var val = "Odstřeženo";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.armed] == 1) {
                            val = "Zastřeženo";
                            col = "rgb(105, 195, 80)";
                            if(value > 0) {
                                val = levels[controlValues[mainItem.states.level]-1]+" alarm aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "level", value: val, color: col }));
                    }
                    if(mainItem.states.armed == uuid) {
                        var val = "Odstřeženo";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1) {
                            val = "Zastřeženo";
                            col = "rgb(105, 195, 80)";
                            if(controlValues[mainItem.states.level] > 0) {
                                val = levels[controlValues[mainItem.states.level]-1]+" alarm aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "level", value: val, color: col }));
                    }
                break;
                case "AalEmergency":
                    var levels = ["Alarm aktivní","Reset vstupu potvrzen, ovládání je vypnuto","Ovládání dočasně zablokováno"];
                    if(mainItem.states.disableEndTime == uuid) {
                        var val = "Připraveno";
                        var col = "rgb(105, 195, 80)";
                        if(value == 4294963696) {
                            if(controlValues[mainItem.states.status] != 0) {
                                val = levels[controlValues[mainItem.states.status]-1];
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            val = "Neaktivní";
                            col = "rgba(234, 234, 245, 0.6)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "alarm", value: val, color: col }));
                    }
                    if(mainItem.states.status == uuid) {
                        var val = "Vše OK";
                        var col = "rgb(105, 195, 80)";
                        if(controlValues[mainItem.states.disableEndTime] == 4294963696) {
                            if(value != 0) {
                                val = levels[value-1]+" poplach aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            val = "Neaktivní";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "alarm", value: val, color: col }));
                    }
                break;
                case "PulseAt":
                    if(mainItem.states.isActive == uuid) {
                        var val = "Neaktivní";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1) {
                            val = "Aktivní";
                            col = "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "pulse", value: val, color: col }));
                    }
                break;
                case "WindowMonitor":
                    if(mainItem.states.numClosed == uuid) {
                        var val = "Zavřeno: "+value;
                        var col = "rgb(105, 195, 80)";
                        if(controlValues[mainItem.states.numOpen] > 0) {
                            val = "Otevřeno: "+controlValues[mainItem.states.numOpen];
                            col = "rgb(247, 181, 92)";
                        }
                        if(controlValues[mainItem.states.numTilted] > 0)
                            col = "rgb(247, 181, 92)";
                        if(controlValues[mainItem.states.numOffline] > 0)
                            col = "rgb(231, 50, 70)";
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "open", value: val, color: col }));
                    }
                    if(mainItem.states.numOpen == uuid) {
                        var val = "Zavřeno: "+controlValues[mainItem.states.numClosed];
                        var col = "rgb(105, 195, 80)";
                        if(value > 0) {
                            val = "Otevřeno: "+value;
                            col = "rgb(247, 181, 92)";
                        }
                        if(controlValues[mainItem.states.numTilted] > 0)
                            col = "rgb(247, 181, 92)";
                        if(controlValues[mainItem.states.numOffline] > 0)
                            col = "rgb(231, 50, 70)";
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "open", value: val, color: col }));
                    }
                    if(mainItem.states.numTilted == uuid) {
                        var val = "";
                        var col = "";
                        if(value > 0) {
                            val = ", Vyklopeno: "+value;
                            col = "rgb(247, 181, 92)";
                        }
                        if(controlValues[mainItem.states.numOffline] > 0)
                            col = "rgb(231, 50, 70)";
                        if(col == "") {
                            if(controlValues[mainItem.states.numOpen] > 0)
                                col = "rgb(247, 181, 92)";
                            else
                                col = "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "tilted", value: val, color: col }));
                    }
                    if(mainItem.states.numOffline == uuid) {
                        var val = "";
                        var col = "";
                        if(value > 0) {
                            val = "Offline: "+value+", ";
                            col = "rgb(231, 50, 70)";
                        } else {
                            if(controlValues[mainItem.states.numTilted] > 0)
                                col = "rgb(247, 181, 92)";
                            if(col == "") {
                                if(controlValues[mainItem.states.numOpen] > 0)
                                    col = "rgb(247, 181, 92)";
                                else
                                    col = "rgb(105, 195, 80)";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "offline", value: val, color: col }));
                    }
                break;
                case "CentralLightController":
                    // No Update Required
                break;
                case "CentralJalousie":
                    // No Update Required
                break;
                case "ClimateController":
                    if(mainItem.states.ventilation == uuid) {
                        var val = "Vypnuto";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1) {
                            val = "Probíhá chalzení";
                            col = "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "vent", value: val, color: col }));
                    }
                break;
                case "LightControllerV2":
                    if(mainItem.states.activeMoodsNum == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.moodList]) {
                            var a = JSON.parse(controlValues[mainItem.states.moodList]);
                            a = a[a.length-1];
                            if(value != a.id) {
                                val = JSON.parse(controlValues[mainItem.states.moodList]).filter(item => {
                                    return item.id == value;
                                })[0];
                                if(val)
                                    val = val.name;
                                else
                                    val = "Vlastní nálada";
                                col = "rgb(105, 195, 80)";
                            } else {
                                val = a.name;
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "mood", value: val, color: col }));
                    }
                break;
                case "AlarmClock":
                    if(mainItem.states.nextEntryTime == uuid) {
                        var val = "Žádný budík";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value != 0) {
                            val = ""+calculateClockDate(value);
                            col = "rgb(105, 195, 80)";
                        }
                        if(controlValues[mainItem.states.isAlarmActive] == 1) {
                            val = "Aktivní";
                            col = "rgb(105, 195, 80)";
                        }
                        if(controlValues[mainItem.states.snoozeTime] > 0) {
                            val = "Odloženo";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "clock", value: val, color: col }));
                    }
                    if(mainItem.states.snoozeTime == uuid) {
                        var val = "Žádný budík";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.nextEntryTime] != 0) {
                            val = ""+calculateClockDate(controlValues[mainItem.states.nextEntryTime]);
                            col = "rgb(105, 195, 80)";
                        }
                        if(controlValues[mainItem.states.isAlarmActive] == 1) {
                            val = "Aktivní";
                            col = "rgb(105, 195, 80)";
                        }
                        if(value > 0) {
                            val = "Odloženo";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "clock", value: val, color: col }));
                    }
                    if(mainItem.states.isAlarmActive == uuid) {
                        var val = "Žádný budík";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.nextEntryTime] != 0) {
                            val = ""+calculateClockDate(controlValues[mainItem.states.nextEntryTime]);
                            col = "rgb(105, 195, 80)";
                        }
                        if(value == 1) {
                            val = "Aktivní";
                            col = "rgb(105, 195, 80)";
                        }
                        if(controlValues[mainItem.states.snoozeTime] > 0) {
                            val = "Odloženo";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "clock", value: val, color: col }));
                    }
                break;
                case "Window":
                    if(mainItem.states.position == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1)
                            val = "Otevřeno";
                        if(value == 0)
                            val = "Zavřeno";
                        if(0 < value && value < 1)
                            switch(controlValues[mainItem.states.direction]) {
                                case -1:
                                    val = "Zavírání ("+Math.round(value*100)+"%)";
                                    col = "rgb(105, 195, 80)";   
                                break;
                                case 0:
                                    val = "Otevřeno ("+Math.round(value*100)+"%)";
                                break;
                                case 1:
                                    val = "Otevírání ("+Math.round(value*100)+"%)";
                                    col = "rgb(105, 195, 80)";
                                break;
                            }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                    if(mainItem.states.direction == uuid)
                        if(value == 0 && 0 < controlValues[mainItem.states.position] && controlValues[mainItem.states.position] < 1)
                            sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: "Otevřeno ("+Math.round(controlValues[mainItem.states.position]*100)+"%)", color: "rgba(234, 234, 245, 0.6)" }));
                break;
                case "Jalousie":
                    if(mainItem.states.position == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1) 
                            val = "Zavřeno";
                        if(value == 0)
                            val = "Otevřeno";
                        if(value < 1 && value > 0) {
                            if(controlValues[mainItem.states.up] == 1) {
                                val = "Otevírání ("+Math.round(value*100)+"%)";
                                col = "rgb(105, 195, 80)";
                            } else if(controlValues[mainItem.states.down] == 1) {
                                val = "Zavírání ("+Math.round(value*100)+"%)";
                                col = "rgb(105, 195, 80)";
                            } else {
                                val = "Zavřeno ("+Math.round(value*100)+"%)";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                break;
                case "Gate":
                    if(mainItem.states.position == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1) {
                            val = "Otevřeno";
                            col = "rgb(247, 181, 92)";
                        }
                        if(value == 0)
                            val = "Zavřeno";
                        if(0 < value && value < 1)
                            switch(controlValues[mainItem.states.active]) {
                                case -1:
                                    val = "Zavírání ("+Math.round(value*100)+"%)";
                                    col = "rgb(105, 195, 80)";   
                                break;
                                case 0:
                                    val = "Otevřeno ("+Math.round(value*100)+"%)";
                                    col = "rgb(247, 181, 92)";
                                break;
                                case 1:
                                    val = "Otevírání ("+Math.round(value*100)+"%)";
                                    col = "rgb(105, 195, 80)";
                                break;
                            }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                    if(mainItem.states.active == uuid) {
                        if(value == 0 && 0 < controlValues[mainItem.states.position] && controlValues[mainItem.states.position] < 1)
                            sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: "Otevřeno ("+Math.round(controlValues[mainItem.states.position]*100)+"%)", color: "rgb(247, 181, 92)" }));
                    }
                break;
                case "Ventilation":
                    if(mainItem.states.speed == uuid) {
                        var val = "Vypnuto";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value > 0) {
                            val = "Intenzita " + value + "%";
                            col = "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "speed", value: val, color: col }));
                    }
                break;
                case "Radio":
                    if(mainItem.states.activeOutput == uuid) {
                        var val = mainItem.details.allOff;
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value != 0) {
                            val = mainItem.details.outputs[value];
                            col = "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "state", value: val, color: col }));
                    }
                break;
                case "Remote":
                    if(mainItem.states.mode == uuid) {
                        var val = "Vypnuto";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value > 0) {
                            val = mainItem.details.modeList[value].name;
                            col = "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "mode", value: val, color: col }));
                    }
                break;
                case "NfcCodeTouch":
                    // No Update Required
                break;
                case "Sauna":
                    var levels = ["Manuální režim sauny","Finská sauna manuálně","Vlhká suana manuálně","Finská sauna","Bylinná sauna","Parní lázeň","Horký vzduch"];
                    if(mainItem.states.active == uuid) {
                        var val = "Vypnuto";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1) {
                            val = levels[controlValues[mainItem.states.mode]];
                            col = "rgb(105, 195, 80)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "turn", value: val, color: col }));
                    }
                break;
                case "Intercom":
                    // No Update Required
                break;
                case "Webpage":
                    // No Update Required
                break;
                case "CentralAudioZone":

                break;
                case "AudioZoneV2":
                    
                break;
            }
        }
    }

    function formatNumber(format, number) {
        var tens = parseInt(format.substring(format.lastIndexOf(".")+1, format.lastIndexOf("f")));
        var roundInNumber = 10 ** tens;
        return format.replace("%."+tens+"f",Math.round(number * roundInNumber) / roundInNumber).replace("%%","%");
    }

    function calculateClockDate(seconds) {
        var newDate = new Date(new Date('2009-01-01').getTime() + seconds * 1000);
        var hours = newDate.getHours();
        hours = hours < 10 ? "0"+hours : hours;
        var minutes = newDate.getMinutes();
        minutes = minutes < 10 ? "0"+minutes : minutes;
        return hours+':'+minutes+' '+newDate.getDate().toString().padStart(2,'0')+'.'+(newDate.getMonth()+1).toString().padStart(2,'0')+'.'+newDate.getFullYear();
    }

    function kwtow(value) {
        if(value < 1)
            return (Math.round(value*1000))+" W";
        else
            return (Math.round(value*100)/100)+" kW";
    }

    log("INFO","Loxone Thread","Listeners for receiving has been added successfully");

    var socket = new LxCommunicator.WebSocket(config);

    log("INFO","Loxone Thread","Trying to fetch settings from Loxone Miniserver");

    axios.get("http://"+lxAddr+"/data/LoxAPP3.json", {headers: {Authorization: "Basic "+Buffer.from(lxUser+':'+lxPass).toString('base64')}}).then(function(lxDataFull) {
        lxData = lxDataFull.data;

        log("INFO","Loxone Thread","Settings from Loxone Miniserver fetched successfully");
        log("INFO","Loxone Thread","Configuring connection has been added successfully");
        log("INFO","Loxone Thread","Trying to create connection with Loxone Miniserver");

        socket.open(lxAddr, lxUser, lxPass).then(function() {
            log("INFO","Loxone Thread","Connection with Loxone Miniserver has been established successfully");
            log("INFO","Loxone Thread","Creating status update listener");
            socket.send("jdev/sps/enablebinstatusupdate").then(function(respons) {
                log("INFO","Loxone Thread","Status update listener has been created");
                var len = Object.keys(lxData.controls).length;
                var currentPercent = 0;
                var currentLoop = 0;
                Object.keys(lxData.controls).forEach(function(uuid) {
                    if(lxData.controls[uuid].states)
                        Object.values(lxData.controls[uuid].states).forEach(function(it) {
                            lxAlias[it] = uuid;
                        });
                    var control = lxData.controls[uuid];
                    var addAlias = lxNamesAlias[uuid] ? lxNamesAlias[uuid]+" " : "";
                    switch(control.type) {
                        case "InfoOnlyDigital":
                            sentenceMapping.push(
                                { command: "InfoOnlyDigital_say:"+uuid, sentence: "jaká je "+addAlias+control.name },
                                { command: "InfoOnlyDigital_say:"+uuid, sentence: "jak "+addAlias+control.name },
                                { command: "InfoOnlyDigital_say:"+uuid, sentence: "kolik je "+addAlias+control.name },
                                { command: "InfoOnlyDigital_say:"+uuid, sentence: "řekni "+addAlias+control.name },
                                { command: "InfoOnlyDigital_say:"+uuid, sentence: "zjisti "+addAlias+control.name },
                                { command: "InfoOnlyDigital_say:"+uuid, sentence: "potřebuji vědět "+addAlias+control.name }
                            );
                        break;
                        case "InfoOnlyAnalog":
                            sentenceMapping.push(
                                { command: "InfoOnlyAnalog_say:"+uuid, sentence: "jaká je "+addAlias+control.name },
                                { command: "InfoOnlyAnalog_say:"+uuid, sentence: "jak "+addAlias+control.name },
                                { command: "InfoOnlyAnalog_say:"+uuid, sentence: "kolik je "+addAlias+control.name },
                                { command: "InfoOnlyAnalog_say:"+uuid, sentence: "řekni "+addAlias+control.name },
                                { command: "InfoOnlyAnalog_say:"+uuid, sentence: "zjisti "+addAlias+control.name },
                                { command: "InfoOnlyAnalog_say:"+uuid, sentence: "potřebuji vědět "+addAlias+control.name }
                            );
                        break;
                        case "Switch":
                            sentenceMapping.push(
                                { command: "Switch_say:"+uuid, sentence: "je zapnutý "+addAlias+control.name },
                                { command: "Switch_say:"+uuid, sentence: "je zapnutá "+addAlias+control.name },
                                { command: "Switch_say:"+uuid, sentence: "je zapnuté "+addAlias+control.name },
                                { command: "Switch_say:"+uuid, sentence: "řekni "+addAlias+control.name },
                                { command: "Switch_say:"+uuid, sentence: "zjisti "+addAlias+control.name },
                                { command: "Switch_say:"+uuid, sentence: "potřebuji vědět "+addAlias+control.name },
                                { command: "Switch_setOn:"+uuid, sentence: "zapni "+addAlias+control.name },
                                { command: "Switch_setOn:"+uuid, sentence: "rožni "+addAlias+control.name },
                                { command: "Switch_setOn:"+uuid, sentence: "rozsviť "+addAlias+control.name },
                                { command: "Switch_setOn:"+uuid, sentence: "nastartuj "+addAlias+control.name },
                                { command: "Switch_setOn:"+uuid, sentence: "nahoď "+addAlias+control.name },
                                { command: "Switch_setOn:"+uuid, sentence: "spusť "+addAlias+control.name },
                                { command: "Switch_setOff:"+uuid, sentence: "vypni "+addAlias+control.name },
                                { command: "Switch_setOff:"+uuid, sentence: "zhasni "+addAlias+control.name },
                                { command: "Switch_setOff:"+uuid, sentence: "zhoď "+addAlias+control.name },
                                { command: "Switch_setOff:"+uuid, sentence: "zastav "+addAlias+control.name }
                            );
                        break;
                        case "TextState":
                            sentenceMapping.push(
                                { command: "TextState_say:"+uuid, sentence: "jaká je "+addAlias+control.name },
                                { command: "TextState_say:"+uuid, sentence: "jak "+addAlias+control.name },
                                { command: "TextState_say:"+uuid, sentence: "kolik je "+addAlias+control.name },
                                { command: "TextState_say:"+uuid, sentence: "řekni "+addAlias+control.name },
                                { command: "TextState_say:"+uuid, sentence: "zjisti "+addAlias+control.name },
                                { command: "TextState_say:"+uuid, sentence: "potřebuji vědět "+addAlias+control.name }
                            );
                        break;
                        case "Meter":
                            sentenceMapping.push(
                                { command: "Meter_say:"+uuid, sentence: "jaká je "+addAlias+control.name },
                                { command: "Meter_say:"+uuid, sentence: "jak "+addAlias+control.name },
                                { command: "Meter_say:"+uuid, sentence: "kolik je "+addAlias+control.name },
                                { command: "Meter_say:"+uuid, sentence: "řekni "+addAlias+control.name },
                                { command: "Meter_say:"+uuid, sentence: "zjisti "+addAlias+control.name },
                                { command: "Meter_say:"+uuid, sentence: "potřebuji vědět "+addAlias+control.name }
                            );
                        break;
                        case "EIBDimmer":
                            sentenceMapping.push(
                                { command: "EIBDimmer_say:"+uuid, sentence: "jaká je "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "jak "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "kolik je "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "řekni "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "zjisti "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "potřebuji vědět "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "je rožnuto "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "je rozsvíceno "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "je zapnuto "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "je zhasnuto "+addAlias+control.name },
                                { command: "EIBDimmer_say:"+uuid, sentence: "je vypnuto "+addAlias+control.name },
                                { command: "EIBDimmer_setOn:"+uuid, sentence: "zapni "+addAlias+control.name },
                                { command: "EIBDimmer_setOn:"+uuid, sentence: "rožni "+addAlias+control.name },
                                { command: "EIBDimmer_setOn:"+uuid, sentence: "rozsviť "+addAlias+control.name },
                                { command: "EIBDimmer_setOn:"+uuid, sentence: "nastartuj "+addAlias+control.name },
                                { command: "EIBDimmer_setOn:"+uuid, sentence: "nahoď "+addAlias+control.name },
                                { command: "EIBDimmer_setOn:"+uuid, sentence: "spusť "+addAlias+control.name },
                                { command: "EIBDimmer_setOff:"+uuid, sentence: "vypni "+addAlias+control.name },
                                { command: "EIBDimmer_setOff:"+uuid, sentence: "zhasni "+addAlias+control.name },
                                { command: "EIBDimmer_setOff:"+uuid, sentence: "zhoď "+addAlias+control.name },
                                { command: "EIBDimmer_setOff:"+uuid, sentence: "zastav "+addAlias+control.name },
                                { command: "EIBDimmer_setChange:"+uuid, sentence: "nastav "+addAlias+control.name },
                                { command: "EIBDimmer_setChange:"+uuid, sentence: "změň "+addAlias+control.name }
                            );
                        break;
                        case "IRoomControllerV2":
                            
                        break;
                        case "PresenceDetector":
                            sentenceMapping.push(
                                { command: "PresenceDetector_say:"+uuid, sentence: "jaká je "+addAlias+control.name },
                                { command: "PresenceDetector_say:"+uuid, sentence: "je někdo v "+addAlias+control.name },
                                { command: "PresenceDetector_say:"+uuid, sentence: "potřebuji vědět "+addAlias+control.name },
                                { command: "PresenceDetector_say:"+uuid, sentence: "řekni "+addAlias+control.name },
                                { command: "PresenceDetector_say:"+uuid, sentence: "zjisti "+addAlias+control.name }
                            );
                        break;
                        case "TimedSwitch":

                        break;
                        case "LeftRightAnalog":

                        break;
                        case "Pushbutton":
                            
                        break;
                        case "Irrigation":

                        break;
                        case "SmokeAlarm":

                        break;
                        case "EnergyManager2":

                        break;
                        case "EFM":

                        break;
                        case "Wallbox2":

                        break;
                        case "LoadManager":

                        break;
                        case "AalSmartAlarm":

                        break;
                        case "Alarm":

                        break;
                        case "AalEmergency":

                        break;
                        case "PulseAt":

                        break;
                        case "WindowMonitor":

                        break;
                        case "CentralLightController":

                        break;
                        case "CentralJalousie":

                        break;
                        case "ClimateController":

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
                        case "Remote":

                        break;
                        case "NfcCodeTouch":

                        break;
                        case "Sauna":

                        break;
                        case "Intercom":
                            
                        break;
                        case "Webpage":
                            
                        break;
                        case "CentralAudioZone":

                        break;
                        case "AudioZoneV2":

                        break;
                    }
                    var calc = Math.round((currentLoop / len)*10)*10;
                    if(currentPercent != calc) {
                        currentPercent = calc;
                        log("INFO","Voice Thread",chalk.yellow("Training voice model "+currentPercent+"%"));
                    }
                    currentLoop++;
                });

                log("INFO","Voice Thread","Voice model has been trained");
                log("INFO","Interface Thread","Initializing Web interface listener");

                var webServer = http.createServer((req, res) => {
                    var filePath = './webinterface' + req.url;
                    if(filePath === './webinterface/') filePath = './webinterface/index.html';
                    var extname = filePath.substring(filePath.lastIndexOf('.'));
                    var mimeTypes = {
                      '.html': 'text/html',
                      '.css': 'text/css',
                      '.js': 'text/javascript',
                      '.json': 'application/json',
                      '.png': 'image/png',
                      '.jpg': 'image/jpg',
                      '.gif': 'image/gif',
                      '.svg': 'image:svg+xml',
                      '.ttf': 'font/ttf'
                    };
                    var contentType = mimeTypes[extname] || 'application/octet-stream';
                    fs.readFile(filePath, (error, content) => {
                        if(error) {
                            if(error.code === 'ENOENT') {
                                res.writeHead(404, { 'Content-Type': 'text/html' });
                                res.end('<h1>404 Not Found</h1>');
                            } else {
                                res.writeHead(500);
                                res.end(`Server Error: ${error.code}`);
                            }
                        } else {
                            res.writeHead(200, { 'Content-Type': contentType });
                            res.end(content, 'utf-8');
                        }
                    });
                });
                log("INFO","Interface Thread","Web interface listener has been initialized");
                log("INFO","Main Thread","Trying to create WebSocket listener");

                var wss = new WebSocketServer({ port: 34987 });
                log("INFO","Main Thread","WebSocket listener is listening");
                log("INFO","Main Thread","Server has been fully started");

                wss.on('connection', function(ws) {
                    clients.add(ws);
                    log("INFO","Connection Thread","Client has connected ["+new Date().getTime().toString(16)+"]");

                    Object.keys(lxData.rooms).forEach(function(item) {
                        controlRoomsIds[item] = (new Date().getTime()*Math.round(10,100)*idSeed).toString(16);
                        idSeed++;
                        ws.send(JSON.stringify({ module: "control", action: "add", menu: "room", uuid: controlRoomsIds[item], title: lxData.rooms[item].name, svg: lxData.rooms[item].image, rating: lxData.rooms[item].defaultRating ? lxData.rooms[item].defaultRating : 0 }));
                    });
                    Object.keys(lxData.cats).forEach(function(item) {
                        controlCatsIds[item] = (new Date().getTime()*Math.round(10,100)*idSeed).toString(16);
                        idSeed++;
                        ws.send(JSON.stringify({ module: "control", action: "add", menu: "category", uuid: controlCatsIds[item], title: lxData.cats[item].name, svg: lxData.cats[item].image, rating: lxData.cats[item].defaultRating ? lxData.cats[item].defaultRating : 0 }));
                    });
                    Object.keys(lxData.controls).forEach(function(item) {
                        controlControlsIds[item] = (new Date().getTime()*Math.round(10,100)*idSeed).toString(16);
                        idSeed++;
                        var name = lxData.controls[item].name;
                        if(lxData.controls[item].preset) {
                            var t = lxData.controls[item].preset.name;
                            name = t.substring(0, t.lastIndexOf(" "));
                        }
                        ws.send(JSON.stringify({ module: "control", action: "add", menu: "control", uuid: controlControlsIds[item], type: lxData.controls[item].type, title: name, svg: lxData.controls[item].defaultIcon ? lxData.controls[item].defaultIcon : "", room: controlRoomsIds[lxData.controls[item].room], category: controlCatsIds[lxData.controls[item].cat], rating: lxData.controls[item].defaultRating ? lxData.controls[item].defaultRating : 0, roomname: lxData.rooms[lxData.controls[item].room].name }));
                    });
                    Object.keys(controlValues).forEach(function(i) {
                        sendValues(i, controlValues[i]);
                    });

                    var sunrise = new Date(weatherReadData["city"]["sunrise"]*1000);
                    var sunset = new Date(weatherReadData["city"]["sunset"]*1000);
                    sunrise = (sunrise.getHours() < 10 ? "0"+sunrise.getHours() : sunrise.getHours())+":"+(sunrise.getMinutes() < 10 ? "0"+sunrise.getMinutes() : sunrise.getMinutes());
                    sunset = (sunset.getHours() < 10 ? "0"+sunset.getHours() : sunset.getHours())+":"+(sunset.getMinutes() < 10 ? "0"+sunset.getMinutes() : sunset.getMinutes());
                    var weatherData = [
                        { icon: getIcon(weatherReadData["list"][0]["weather"][0]["icon"]), temperature: Math.round(weatherReadData["list"][0]["main"]["temp"])/10, feeltemperature: Math.round(weatherReadData["list"][0]["main"]["feels_like"])/10, pressure: weatherReadData["list"][0]["main"]["pressure"], precip: weatherReadData["list"][0]["pop"], humidity: weatherReadData["list"][0]["main"]["humidity"], clouds: weatherReadData["list"][0]["clouds"]["all"], windspeed: weatherReadData["list"][0]["wind"]["speed"], winddir: getWindDir(weatherReadData["list"][0]["wind"]["deg"]), sunrise: sunrise, sunset: sunset },
                        { icon: getIcon(weatherReadData["list"][1]["weather"][0]["icon"]), temperature: Math.round(weatherReadData["list"][1]["main"]["temp"])/10, feeltemperature: Math.round(weatherReadData["list"][4]["main"]["feels_like"])/10, pressure: weatherReadData["list"][1]["main"]["pressure"], precip: weatherReadData["list"][1]["pop"], humidity: weatherReadData["list"][1]["main"]["humidity"], clouds: weatherReadData["list"][1]["clouds"]["all"], windspeed: weatherReadData["list"][1]["wind"]["speed"], winddir: getWindDir(weatherReadData["list"][1]["wind"]["deg"]), sunrise: sunrise, sunset: sunset },
                        { icon: getIcon(weatherReadData["list"][5]["weather"][0]["icon"]), temperature: Math.round(weatherReadData["list"][5]["main"]["temp"])/10, feeltemperature: Math.round(weatherReadData["list"][5]["main"]["feels_like"])/10, pressure: weatherReadData["list"][5]["main"]["pressure"], precip: weatherReadData["list"][5]["pop"], humidity: weatherReadData["list"][5]["main"]["humidity"], clouds: weatherReadData["list"][5]["clouds"]["all"], windspeed: weatherReadData["list"][5]["wind"]["speed"], winddir: getWindDir(weatherReadData["list"][5]["wind"]["deg"]), sunrise: sunrise, sunset: sunset },
                        { icon: getIcon(weatherReadData["list"][12]["weather"][0]["icon"]), temperature: Math.round(weatherReadData["list"][12]["main"]["temp"])/10, feeltemperature: Math.round(weatherReadData["list"][12]["main"]["feels_like"])/10, pressure: weatherReadData["list"][12]["main"]["pressure"], precip: weatherReadData["list"][12]["pop"], humidity: weatherReadData["list"][12]["main"]["humidity"], clouds: weatherReadData["list"][12]["clouds"]["all"], windspeed: weatherReadData["list"][12]["wind"]["speed"], winddir: getWindDir(weatherReadData["list"][12]["wind"]["deg"]), sunrise: sunrise, sunset: sunset }
                    ];
                    ws.send(JSON.stringify({ module: "weather", data: weatherData }))
                    function getIcon(code) {
                        switch(code) {case "01d":return '<i class="wi wi-day-sunny"></i>';break;case "02d":return '<i class="wi wi-cloudy"></i>';break;case "03d":return '<i class="wi wi-cloudy"></i>';break;case "04d":return '<i class="wi wi-cloudy"></i>';break;case "09d":return '<i class="wi wi-sprinkle"></i>';break;case "10d":return '<i class="wi wi-sprinkle"></i>';break;case "11d":return '<i class="wi wi-night-thunderstorm"></i>';break;case "13d":return '<i class="wi wi-night-alt-snow"></i>';break;case "50d":return '<i class="wi wi-day-cloudy-windy"></i>';break;case "01n":return '<i class="wi wi-day-sunny"></i>';break;case "02n":return '<i class="wi wi-cloudy"></i>';break;case "03n":return '<i class="wi wi-cloudy"></i>';break;case "04n":return '<i class="wi wi-cloudy"></i>';break;case "09n":return '<i class="wi wi-sprinkle"></i>';break;case "10n":return '<i class="wi wi-sprinkle"></i>';break;case "11n":return '<i class="wi wi-night-thunderstorm"></i>';break;case "13n":return '<i class="wi wi-night-alt-snow"></i>';break;case "50n":return '<i class="wi wi-day-cloudy-windy"></i>';break;}
                    }
                    function getWindDir(angle) {
                        if((angle > 337.5 && angle < 360) || (angle > 0 && angle <= 22.5)) {
                            return "Sever ("+angle+"°)";
                        } else if(angle > 22.5 && angle <= 67.5) {
                            return "Severo-Západ ("+angle+"°)";
                        } else if(angle > 67.5 && angle <= 112.5) {
                            return "Západ ("+angle+"°)";
                        } else if(angle > 112.5 && angle <= 157.5) {
                            return "Jiho-Západ ("+angle+"°)";
                        } else if(angle > 157.5 && angle <= 202.5) {
                            return "Jih ("+angle+"°)";
                        } else if(angle > 202.5 && angle <= 247.5) {
                            return "Jiho-Východ ("+angle+"°)";
                        } else if(angle > 247.5 && angle <= 292.5) {
                            return "Východ ("+angle+"°)";
                        } else if(angle > 292.5 && angle <= 337.5) {
                            return "Severo-Východ ("+angle+"°)";
                        }
                    }

                    ws.on('message', function(data) {
                        var dt = JSON.parse(new Buffer.from(data).toString());
                        switch(dt["module"]) {
                            case "loxone":
                                if(dt["action"] == "resend") {
                                    socket.send(dt["value"]).then(function(d) {
                                        sendMessage(JSON.stringify({ module: "loxone", type: "response", data: d }));
                                    }).catch(function(err) {
                                        sendMessage(JSON.stringify({ module: "loxone", type: "response", data: err }));
                                    });
                                } else {
                                    log("ERROR","Communication Thread","Accepted incorrent command from client");
                                    ws.send("ERROR:[NEPLATNÁ AKCE]");
                                }
                            break;
                            case "speech":
                                var sentence = dt["sentence"].toLowerCase();
                                var command = processSentence(sentence).split(":");
                                var control = lxData.controls[command[1]];
                                switch(command[0]) {
                                    case "Switch_setOn":
                                        socket.send("jdev/sps/io/"+control.uuidAction+"/on");
                                        log("INFO","Voice Thread","Recieved voice command to turn on the switch, {uuid:"+control.uuidAction+",state:on,sure:"+command[2]+"}");
                                    break;
                                    case "Switch_setOff":
                                        socket.send("jdev/sps/io/"+control.uuidAction+"/off");
                                        log("INFO","Voice Thread","Recieved voice command to turn off the switch, {uuid:"+control.uuidAction+",state:off,sure:"+command[2]+"}");
                                    break;
                                    case "Switch_say":
                                        
                                    break;
                                    case "EIBDimmer_say":
                                        
                                    break;
                                    case "EIBDimmer_setOn":
                                        if(sentence.includes("%")) {
                                            var half = sentence.substring(0, sentence.lastIndexOf("%"));
                                            var percent = half.substring(half.lastIndexOf(" ")+1, half.length);
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/"+percent+".000000");
                                            log("INFO","Voice Thread","Recieved voice command to turn on the dimmer, percent detected changing, {uuid:"+control.uuidAction+",value:"+percent+",sure:"+command[2]+"}");
                                        } else {
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/100.000000");
                                            log("INFO","Voice Thread","Recieved voice command to turn on the dimmer, {uuid:"+control.uuidAction+",value:"+percent+",sure:"+command[2]+"}");
                                        }
                                    break;
                                    case "EIBDimmer_setOff":
                                        if(sentence.includes("%")) {
                                            var half = sentence.substring(0, sentence.lastIndexOf("%"));
                                            var percent = half.substring(half.lastIndexOf(" ")+1, half.length);
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/"+percent+".000000");
                                            log("INFO","Voice Thread","Recieved voice command to turn off the dimmer, percent detected changing, {uuid:"+control.uuidAction+",value:"+percent+",sure:"+command[2]+"}");
                                        } else {
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/0.000000");
                                            log("INFO","Voice Thread","Recieved voice command to turn off the dimmer, {uuid:"+control.uuidAction+",value:"+percent+",sure:"+command[2]+"}");
                                        }
                                    break;
                                    case "EIBDimmer_setChange":
                                        if(sentence.includes("%")) {
                                            var half = sentence.substring(0, sentence.lastIndexOf("%"));
                                            var percent = half.substring(half.lastIndexOf(" ")+1, half.length);
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/"+percent+".000000");
                                            log("INFO","Voice Thread","Recieved voice command to change dimmer value, {uuid:"+control.uuidAction+",value:"+percent+",sure:"+command[2]+"}");
                                        } else {
                                            log("INFO","Voice Thread","Recieved voice command to change dimmer value, but percent value is not set");
                                        }
                                    break;
                                }
                                
                                function processSentence(sentence) {
                                    var bestMatch = null, bestScore = 0;
                                    for(var mapping of sentenceMapping) {
                                        var distance = natural.JaroWinklerDistance(mapping.sentence.toLowerCase(), sentence, { caseSensitive: false });
                                        //console.log({sentence: sentence, mapping: mapping.sentence.toLowerCase(), score: distance});
                                        if(distance>bestScore) {
                                            bestMatch = mapping.command;
                                            bestScore = distance;
                                        }
                                    }
                                    return bestMatch+":"+(Math.round(distance*100))+"%";
                                }
                            break;
                            default:
                                log("ERROR","Communication Thread","Accepted incorrent command from client-");
                                ws.send("ERROR:[NEPLATNÝ MODUL]");
                            break;
                        }


                    });

                    ws.on('close', function(ws) {
                        clients.delete(ws);
                        clients.clear();
                        log("INFO","Connection Thread","Client has disconnected");
                    });
                });

                var userInput = readline.createInterface({
                    input: process.stdin,
                    output: process.stdout
                });

                log("INFO","Interface Thread","Trying to create Web Interface listener");
                webServer.listen(80, () => {
                    log("INFO","Interface Thread","Web Interface listener has been created");
                    log("INFO","Interface Thread","Web Interface listener running on "+chalk.underline("http://localhost:80"));
                    promptUser();
                });
                
                function promptUser() {
                    userInput.question('> ', (commandandargs) => {
                        fs.appendFile("server.log", "> "+commandandargs+"\n", function() {});
                        var all = commandandargs.split(" ");
                        var command = all[0];all[0] = "";
                        var args = all.filter((arg) => arg !== "");
                        switch(command) {
                            case "stop":
                                process.exit(0);
                            break;
                            default:
                                log("INFO","Console Thread","Command '"+command+"' does not exist!");
                            break;
                        }
                        promptUser();
                    });
                }
            });
        });
    });

    function sendMessage(message) {
        clients.forEach((client) => {
            if(client.readyState === WebSocket.OPEN) {
                client.send(message);
            }
        });
    }
}

process.on('exit', function(code) {
    log("INFO","Main Thread","Server shutdown requested");
});

function sendToSpeech(text) {
    console.log("#######################################");
    console.log(text);
    console.log("#######################################");
}
    
function log(level, module, text) {
    var date = new Date();
    var day = date.getDay();if(day < 10) day = "0"+day;
    var month = date.getMonth();if(month < 10) month = "0"+month;
    var hours = date.getHours();if(hours < 10) hours = "0"+hours;
    var minutes = date.getMinutes();if(minutes < 10) minutes = "0"+minutes;
    var seconds = date.getSeconds();if(seconds < 10) seconds = "0"+seconds;
    var fDate = day+"-"+month+"-"+date.getFullYear()+" "+hours+":"+minutes+":"+seconds+"."+date.getMilliseconds();
    fs.appendFile("server.log", "["+fDate+"] ["+level+"] ["+module+"] "+text.replace(/[\u001b\u009b][[()#;?]*(?:[0-9]{1,4}(?:;[0-9]{0,4})*)?[0-9A-ORZcf-nqry=><]/g, "")+"\n", function() {});
    module = chalk.blue(module);
    fDate = chalk.gray(fDate);
    if(level == "INFO") {
        console.log("["+fDate+"] ["+chalk.cyan("INFO")+"] ["+module+"] "+text);
    } else if(level == "WARNING") {
        console.log("["+fDate+"] ["+chalk.cyan("WARNING")+"] ["+module+"] "+text);
    } else if(level == "ERROR") {
        console.log("["+fDate+"] ["+chalk.red("ERROR")+"] ["+module+"] "+text);
    }
}