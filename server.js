import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import LxCommunicator from "LxCommunicator";
import axios from 'axios';
import fs from 'fs';
import natural from 'natural';
import chalk from 'chalk';
import readline from 'readline';
import vosk from 'vosk';
import mic from 'mic';

log("INFO","Main Thread","Initializing varriables");

vosk.setLogLevel(0);
var speechModel;
var speechRecognizer;
var speechMicrophone;
var speechMicrophoneStream;
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

        log("INFO","Main Thread","Loading Speech Model");
        speechModel = new vosk.Model("models/cs-cz");
        log("INFO","Main Thread","Speech Model has been loaded");
        log("INFO","Main Thread","Creating Speech Recognizer");
        speechRecognizer = new vosk.Recognizer({model: speechModel, sampleRate: 44100});
        log("INFO","Main Thread","Speech Recognizer has been created");
        log("INFO","Main Thread","Registrating listener for microphone");
        speechMicrophone = mic({
            rate: String(25000),
            channels: '1',
            debug: false,
            device: 'default',
        });
        speechMicrophoneStream = speechMicrophone.getAudioStream();
        log("INFO","Main Thread","Listener for microphone has been registrated");
    
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
                                        val = value < 0 ? "Nabíjení "+formatNumber(mainItem.details.actualFormat, value) : "Dodávání "+formatNumber(mainItem.details.actualFormat, value);
                                        col = value < 0 ? "rgb(105, 195, 80)" : "rgb(247, 181, 92)";
                                    } else {
                                        val = "Neaktivní";
                                        col = "rgba(234, 234, 245, 0.6)";
                                    }
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, itemtype: mainItem.details.type, subtype: "actual", value: val, color: col }));
                                }
                                if(mainItem.states.storage == uuid)
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, itemtype: mainItem.details.type, subtype: "storage", value: formatNumber(mainItem.details.storageFormat, value) }));
                            break;
                            case "unidirectional":
                                if(mainItem.states.actual == uuid)
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, itemtype: mainItem.details.type, subtype: "actual", value: formatNumber(mainItem.details.actualFormat, value), color: Math.round(value) == 0 ? "rgba(234, 234, 245, 0.6)" : "rgb(105, 195, 80)" }));
                                if(mainItem.states.total == uuid)
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, itemtype: mainItem.details.type, subtype: "total", value: ""+formatNumber(mainItem.details.totalFormat, value) }));
                            break;
                            case "bidirectional":
                                if(mainItem.states.actual == uuid) {
                                    var col = "rgba(234, 234, 245, 0.6)";
                                    if(value != 0) col = value < 0 ? "rgb(105, 195, 80)" : "rgb(247, 181, 92)";
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, itemtype: mainItem.details.type, subtype: "actual", value: formatNumber(mainItem.details.actualFormat, value), color: col }));
                                }
                                if(mainItem.states.total == uuid)
                                    sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, itemtype: mainItem.details.type, subtype: "total", value: formatNumber(mainItem.details.totalFormat, value) }));
                            break;
                        }
                    else {
                        if(mainItem.states.actual == uuid)
                            sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, itemtype: "unidirectional", subtype: "actual", value: formatNumber(mainItem.details.actualFormat, value) }));
                        if(mainItem.states.total == uuid)
                            sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, itemtype: "unidirectional", subtype: "total", value: ""+formatNumber(mainItem.details.totalFormat, value) }));
                    }
                break;
                case "EIBDimmer":
                    if(mainItem.states.position == uuid) {
                        var val = value;
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
                    if(mainItem.states.active == uuid) {
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "active", value: value == 0 ? "Bez přítomnosti" : "Přítomnost aktivní", color: value == 0 ? "rgba(234, 234, 245, 0.6)" : "rgb(105, 195, 80)" }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "value", value: value }));
                    }
                    if(mainItem.states.activeSince == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "from", value: controlValues[mainItem.states.active] == 1 ? calculateClockDate(value) : "--:--" }));
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
                        if(value + step <= max)
                            val += " • "+(value + step);
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
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "active", value: value == -1 ? 0 : 1 }));
                    }
                break;
                case "SmokeAlarm":
                    if(mainItem.states.level == uuid) {
                        var val = "Vše OK";
                        var col = "rgb(105, 195, 80)";
                        var active = controlValues[mainItem.states.timeServiceMode] <= 0 && value > 0;
                        if(value > 0) {
                            val = "Alarm aktivní";
                            col = "rgb(231, 50, 70)";
                        }
                        if(controlValues[mainItem.states.timeServiceMode] > 0) {
                            val = "Servisní režim aktivní";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "level", value: val, color: col }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "active", value: active ? 1 : 0 }));
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
                    if(mainItem.states.areAlarmSignalsOff == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "signals", value: value }));
                break;
                case "EnergyManager2":
                    if(mainItem.states.Gpwr == uuid) {
                        var Gpwr = controlValues[mainItem.states.Gpwr];
                        var Spwr = controlValues[mainItem.states.Spwr];
                        var Ppwr = controlValues[mainItem.states.Ppwr];
                        var total = Spwr+Ppwr;
                        var percent = 100;
                        var freePercent = 0;
                        var freeTotal = 0;
                        var val = "";
                        var col = "";
                        var val1 = { storagePower: Gpwr, storagePowerFormat: Math.round(Gpwr)+" kW", storageCharge: controlValues[mainItem.states.Ssoc], storageChargeFormat: controlValues[mainItem.states.Ssoc]+"%" };
                        if(Gpwr > 0) {
                            percent = Math.round((1-Gpwr/(Gpwr+total))*100);
                            total = Math.round((total+Gpwr)*1000)/1000;
                            val = percent+"% Vlastní spotřeba";
                            col = "rgb(105, 195, 80)";
                        } else {
                            freePercent = Gpwr/(total+Gpwr*-1);
                            freeTotal = Gpwr*-1;
                            val = kwtow(freeTotal)+" ze sítě";
                            col = "rgb(247, 181, 92)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "custompower", value: { total: total, percent: percent, color: percent > 0 ? "rgb(105, 195, 80)" : "rgba(234, 234, 245, 0.6)", freeTotal: freeTotal, freePercent: freePercent, freeColor: freePercent > 0 ? "rgb(105, 195, 80)" : "rgba(234, 234, 245, 0.6)" } }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "status", value: val, color: col }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "battery", value: val1 }));
                    }
                    if(mainItem.states.Ssoc == uuid) {
                        var val1 = { storagePower: controlValues[mainItem.states.Gpwr], storagePowerFormat: Math.round(controlValues[mainItem.states.Gpwr])+" kW", storageCharge: value, storageChargeFormat: value+"%" };
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "battery", value: val1 }));
                    }
                    if(mainItem.states.loads == uuid) {
                        var val = [];
                        var active = 0;
                        JSON.parse(value).forEach(function(item) {
                            var state = "Automatika";
                            var number = 0;
                            active = item.active ? 1 : 0;
                            if(item.activatedManually) {
                                state = "Zapnuto do půlnoci";
                                number = 1;
                            }
                            if(item.deactivatedManually) {
                                state = "Vypnuto do půlnoci";
                                number = 2;
                            }
                            val.push({ name: item.name, power: item.pwr+" kW", active: active, state: state, number: number });
                        });
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "loads", value: val }));
                    }
                    if(mainItem.states.MinSoc == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "minstorage", value: value }));
                    if(mainItem.states.MaxSpwr == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "maxstorage", value: value }));

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
                            if(mainItem.states.enabled == uuid) {
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "enabled", value: value == 0 ? "Nabíjení pozastaveno • " : "Nabíjení • " }));
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "started", value: value }));
                            }
                            if(mainItem.states.limit == uuid) {
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "power", value: formatNumber(mainItem.details.actualFormat, controlValues[mainItem.states.actual])+" / "+formatNumber(mainItem.details.actualFormat, value) }));
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "limit", value: { value: value, format: formatNumber(mainItem.details.actualFormat, value) } }));
                            }
                            if(mainItem.states.actual == uuid)
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "power", value: formatNumber(mainItem.details.actualFormat, value)+" / "+formatNumber(mainItem.details.actualFormat, controlValues[mainItem.states.limit]) }));
                            if(mainItem.states.session == uuid) {
                                var parseData = JSON.parse(value);
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "charge", value: formatNumber(mainItem.details.totalFormat, parseData.energy) }));
                            }
                            if(mainItem.states.mode == uuid)
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "mode", value: value }));
                            if(mainItem.states.modes == uuid)
                                sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "modes", value: JSON.parse(value) }));
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
                    var cmode = ["none","none","none","none"];
                    if(mainItem.states.level == uuid) {
                        var val = "Odstřeženo";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.armed] == 1) {
                            cmode[2] = "block";
                            val = "Zastřeženo";
                            col = "rgb(105, 195, 80)";
                            if(value > 0) {
                                cmode[3] = "block";
                                val = levels[controlValues[mainItem.states.level]-1]+" alarm aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            if(controlValues[mainItem.states.armedAt] == 0) {
                                cmode[0] = "block";
                                cmode[1] = "block";
                            } else {
                                val = "Zastřežení v "+convertUnixToFutureTime(controlValues[mainItem.states.armedAt]);
                                col = "rgb(247, 181, 92)";
                                cmode[0] = "block";
                                cmode[2] = "block";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "level", value: val, color: col }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "cmode", value: cmode }));
                    }
                    if(mainItem.states.armed == uuid) {
                        var val = "Odstřeženo";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1) {
                            cmode[2] = "block";
                            val = "Zastřeženo";
                            col = "rgb(105, 195, 80)";
                            if(controlValues[mainItem.states.level] > 0) {
                                cmode[3] = "block";
                                val = levels[controlValues[mainItem.states.level]-1]+" alarm aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            if(controlValues[mainItem.states.armedAt] == 0) {
                                cmode[0] = "block";
                                cmode[1] = "block";
                            } else {
                                val = "Zastřežení v "+convertUnixToFutureTime(controlValues[mainItem.states.armedAt]);
                                col = "rgb(247, 181, 92)";
                                cmode[0] = "block";
                                cmode[2] = "block";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "level", value: val, color: col }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "cmode", value: cmode }));
                    }
                    if(mainItem.states.armedAt == uuid) {
                        var val = "Odstřeženo";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.armed] == 1) {
                            cmode[2] = "block";
                            val = "Zastřeženo";
                            col = "rgb(105, 195, 80)";
                            if(controlValues[mainItem.states.armed] > 0) {
                                cmode[3] = "block";
                                val = levels[controlValues[mainItem.states.level]-1]+" alarm aktivní";
                                col = "rgb(231, 50, 70)";
                            }
                        } else {
                            if(controlValues[mainItem.states.armedAt] == 0) {
                                cmode[0] = "block";
                                cmode[1] = "block";
                            } else {
                                val = "Zastřežení v "+convertUnixToFutureTime(controlValues[mainItem.states.armedAt]);
                                col = "rgb(247, 181, 92)";
                                cmode[0] = "block";
                                cmode[2] = "block";
                            }
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "level", value: val, color: col }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "cmode", value: cmode }));
                    }
                    if(mainItem.states.disabledMove == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "movement", value: value == 1 ? true : false }));
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
                    if(mainItem.states.windowStates == uuid) {
                        var statesData = [];
                        var states = {
                            none: "Offline;rgb(231, 50, 70)",
                            1: "Zavřeno;rgb(105, 195, 80)",
                            2: "Vyklopeno;rgb(247, 181, 92)",
                            4: "Otevřeno;rgb(247, 181, 92)",
                            8: "Zamčeno;rgb(105, 195, 80)",
                            16: "Odemčeno;rgb(247, 181, 92)"
                        }
                        value.split(",").forEach(function(state, index) {
                            var t = states[state == "" ? "none" : state].split(";");
                            statesData.push({ id: index, text: t[0], color: t[1] });
                        });
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "update", value: statesData }));
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
                        if(controlValues[mainItem.states.presenceTo] && controlValues[mainItem.states.presenceTo] > 0) {
                            val += " (Simulace přítomnosti)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "mood", value: val, color: col }));
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "activemood", value: value }));
                    }
                    if(mainItem.states.moodList == uuid)
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "moodlist", value: JSON.parse(value) }));
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
                        if(controlValues[mainItem.states.direction] == -1) {
                            val = "Zavírání ("+Math.round(value*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(controlValues[mainItem.states.direction] == 1) {
                            val = "Otevírání ("+Math.round(value*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(0 < value && value < 1) {
                            val = "Otevřeno ("+Math.round(value*100)+"%)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                    if(mainItem.states.direction == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.position] == 1)
                            val = "Otevřeno";
                        if(controlValues[mainItem.states.position] == 0)
                            val = "Zavřeno";
                        if(value == -1) {
                            val = "Zavírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(value == 1) {
                            val = "Otevírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(0 < controlValues[mainItem.states.position] && controlValues[mainItem.states.position] < 1) {
                            val = "Otevřeno ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                break;
                case "Jalousie":
                    if(mainItem.states.position == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(value == 1) 
                            val = "Zavřeno";
                        if(value == 0)
                            val = "Otevřeno";
                        if(controlValues[mainItem.states.up] == 1) {
                            val = "Otevírání ("+Math.round(value*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(controlValues[mainItem.states.down] == 1) {
                            val = "Zavírání ("+Math.round(value*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(0 < controlValues[mainItem.states.position] && controlValues[mainItem.states.position] < 1) {
                            val = "Zavřeno ("+Math.round(value*100)+"%)";
                        }
                        if(controlValues[mainItem.states.locked] == 1) {
                            val = "Zamčeno";
                            col = "rgb(231, 50, 70)";
                        }
                        if(controlValues[mainItem.states.safetyActive] == 1) {
                            val = "Bezpečnostní vypnutí";
                            col = "rgb(231, 50, 70)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                    if(mainItem.states.up == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.position] == 1) 
                            val = "Zavřeno";
                        if(controlValues[mainItem.states.position] == 0)
                            val = "Otevřeno";
                        if(value == 1) {
                            val = "Otevírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(controlValues[mainItem.states.down] == 1) {
                            val = "Zavírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(0 < controlValues[mainItem.states.position] && controlValues[mainItem.states.position] < 1) {
                            val = "Zavřeno ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                        }
                        if(controlValues[mainItem.states.locked] == 1) {
                            val = "Zamčeno";
                            col = "rgb(231, 50, 70)";
                        }
                        if(controlValues[mainItem.states.safetyActive] == 1) {
                            val = "Bezpečnostní vypnutí";
                            col = "rgb(231, 50, 70)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                    if(mainItem.states.down == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.position] == 1) 
                            val = "Zavřeno";
                        if(controlValues[mainItem.states.position] == 0)
                            val = "Otevřeno";
                        if(controlValues[mainItem.states.up] == 1) {
                            val = "Otevírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(value == 1) {
                            val = "Zavírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(0 < controlValues[mainItem.states.position] && controlValues[mainItem.states.position] < 1) {
                            val = "Zavřeno ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                        }
                        if(controlValues[mainItem.states.locked] == 1) {
                            val = "Zamčeno";
                            col = "rgb(231, 50, 70)";
                        }
                        if(controlValues[mainItem.states.safetyActive] == 1) {
                            val = "Bezpečnostní vypnutí";
                            col = "rgb(231, 50, 70)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                    if(mainItem.states.locked == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.position] == 1) 
                            val = "Zavřeno";
                        if(controlValues[mainItem.states.position] == 0)
                            val = "Otevřeno";
                        if(controlValues[mainItem.states.up] == 1) {
                            val = "Otevírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(controlValues[mainItem.states.down] == 1) {
                            val = "Zavírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(0 < controlValues[mainItem.states.position] && controlValues[mainItem.states.position] < 1) {
                            val = "Zavřeno ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                        }
                        if(value == 1) {
                            val = "Zamčeno";
                            col = "rgb(231, 50, 70)";
                        }
                        if(controlValues[mainItem.states.safetyActive] == 1) {
                            val = "Bezpečnostní vypnutí";
                            col = "rgb(231, 50, 70)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                    if(mainItem.states.safetyActive == uuid) {
                        var val = "";
                        var col = "rgba(234, 234, 245, 0.6)";
                        if(controlValues[mainItem.states.position] == 1) 
                            val = "Zavřeno";
                        if(controlValues[mainItem.states.position] == 0)
                            val = "Otevřeno";
                        if(controlValues[mainItem.states.up] == 1) {
                            val = "Otevírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(controlValues[mainItem.states.down] == 1) {
                            val = "Zavírání ("+Math.round(controlValues[mainItem.states.position]*100)+"%)";
                            col = "rgb(105, 195, 80)";
                        } else if(0 < controlValues[mainItem.states.position] && controlValues[mainItem.states.position] < 1) {
                            val = "Zavřeno ("+Math.round(value*100)+"%)";
                        }
                        if(controlValues[mainItem.states.locked] == 1) {
                            val = "Zamčeno";
                            col = "rgb(231, 50, 70)";
                        }
                        if(value == 1) {
                            val = "Bezpečnostní vypnutí";
                            col = "rgb(231, 50, 70)";
                        }
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "position", value: val, color: col }));
                    }
                    if(mainItem.states.autoActive == uuid) {
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "auto", value: value == 1 ? true : false }));
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
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "update", value: value }));
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
                        sendMessage(JSON.stringify({ module: "control", action: "update", uuid: myUuid, type: mainItem.type, subtype: "update", value: value }));
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
        return format.replace("%."+tens+"f",(Math.round(number * roundInNumber) / roundInNumber)+" ").replace("%%","%");
    }

    function convertUnixToFutureTime(unixTimestamp) {
        var futureDate = new Date(unixTimestamp * 1000);
        var year = futureDate.getFullYear();
        var month = (futureDate.getMonth() + 1).toString().padStart(2, '0');
        var day = futureDate.getDate().toString().padStart(2, '0');
        var hours = futureDate.getHours().toString().padStart(2, '0');
        var minutes = futureDate.getMinutes().toString().padStart(2, '0');
        var seconds = futureDate.getSeconds().toString().padStart(2, '0');
        return hours+':'+minutes+':'+seconds+' '+day+'.'+month+'.'+year;
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
                        var subtype = "";
                        var min = 0;
                        var max = 0;
                        var windows = [];
                        var modes = [];
                        if(lxData.controls[item].preset) {
                            var t = lxData.controls[item].preset.name;
                            name = t.substring(0, t.lastIndexOf(" "));
                        }
                        if(lxData.controls[item].details && lxData.controls[item].details.type)
                            subtype = lxData.controls[item].details.type;
                        if(lxData.controls[item].details && lxData.controls[item].details.min)
                            min = lxData.controls[item].details.min;
                        if(lxData.controls[item].details && lxData.controls[item].details.max)
                            max = lxData.controls[item].details.max;
                        if(lxData.controls[item].details && lxData.controls[item].details.windows)
                            lxData.controls[item].details.windows.forEach(function(item, index) {
                                windows.push({ id: index, window: item.name, room: lxData.rooms[item.room].name });
                            });
                        if(lxData.controls[item].details && lxData.controls[item].details.outputs) {
                            Object.values(lxData.controls[item].details.outputs).forEach(function(item, index) {
                                modes.push({ id: index+1, title: item });
                            });
                            modes.push({ id: 0, title: lxData.controls[item].details.allOff });
                        }
                        if(lxData.controls[item].details && lxData.controls[item].details.modeList) {
                            Object.values(lxData.controls[item].details.modeList).forEach(function(item, index) {
                                modes.push({ id: index+1, name: item.name, command: "mode/"+(index+1) });
                            });
                            modes.push({ id: 0, name: "Vypnuto", command: "reset" });
                        }
                        ws.send(JSON.stringify({ module: "control", action: "add", menu: "control", uuid: controlControlsIds[item], type: lxData.controls[item].type, subtype: subtype, title: name, svg: lxData.controls[item].defaultIcon ? lxData.controls[item].defaultIcon : "", room: controlRoomsIds[lxData.controls[item].room], category: controlCatsIds[lxData.controls[item].cat], rating: lxData.controls[item].defaultRating ? lxData.controls[item].defaultRating : 0, roomname: lxData.rooms[lxData.controls[item].room].name, min: min, max: max, windows: windows, modes: modes }));
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
                            case "control":
                                if(dt["action"] == "change") {
                                    var uid = "";
                                    Object.keys(controlControlsIds).forEach(function(v) {
                                        if(dt["uuid"] == controlControlsIds[v]) uid = v;
                                    });
                                    var type = dt["type"];
                                    var value = dt["value"];
                                    switch(type) {
                                        case "Switch":
                                            switch(value) {
                                                case 0:
                                                    socket.send("jdev/sps/io/"+uid+"/off");
                                                break;
                                                case 1:
                                                    socket.send("jdev/sps/io/"+uid+"/on");
                                                break;
                                            }
                                        break;
                                        case "EIBDimmer":
                                            if(typeof value == "string" && value.includes("%"))
                                                socket.send("jdev/sps/io/"+uid+"/"+value.replace("%",""));
                                            else
                                                if(value == 1)
                                                    socket.send("jdev/sps/io/"+uid+"/on");
                                                else
                                                    socket.send("jdev/sps/io/"+uid+"/off");
                                        break;
                                        case "IRoomControllerV2":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "TimedSwitch":
                                            switch(value) {
                                                case "push":
                                                    socket.send("jdev/sps/io/"+uid+"/pulse");
                                                break;
                                            }
                                        break;
                                        case "LeftRightAnalog":
                                            var current = controlValues[lxData.controls[uid].states.value];
                                            var step = lxData.controls[uid].details.step;
                                            var min = lxData.controls[uid].details.min;
                                            var max = lxData.controls[uid].details.max;
                                            switch(value) {
                                                case "left":
                                                    if(current-step >= min)
                                                        socket.send("jdev/sps/io/"+uid+"/"+(current-step));
                                                break;
                                                case "right":
                                                    if(current+step <= max)
                                                        socket.send("jdev/sps/io/"+uid+"/"+(current+step));
                                                break;
                                            }
                                        break;
                                        case "Pushbutton":
                                            switch(value) {
                                                case "push":
                                                    socket.send("jdev/sps/io/"+uid+"/pulse");
                                                break;
                                            }
                                        break;
                                        case "Irrigation":
                                            socket.send("jdev/sps/io/"+uid+"/"+value);
                                        break;
                                        case "SmokeAlarm":
                                            switch(value) {
                                                case "confirm":
                                                    socket.send("jdev/sps/io/"+uid+"/confirm");
                                                break;
                                                case "mute":
                                                    socket.send("jdev/sps/io/"+uid+"/mute");
                                                break;
                                                default:
                                                    if(value.includes("service:"))
                                                        socket.send("jdev/sps/io/"+uid+"/"+value.replace("service:",""));
                                                break;
                                            }
                                        break;
                                        case "EnergyManager2":
                                            if(value.includes("minstorage:"))
                                                socket.send("jdev/sps/io/"+uid+"/setMinSoc/"+value.replace("minstorage:",""));
                                            if(value.includes("maxstorage:"))
                                                socket.send("jdev/sps/io/"+uid+"/setMaxSpwr/"+value.replace("maxstorage:",""));
                                            if(value.includes("mode:")) {
                                                var val = value.split(":");
                                                JSON.parse(controlValues[lxData.controls[uid].states.loads]).forEach(function(item) {
                                                    if(item.id.toString() == val[1])
                                                        socket.send("jdev/sps/io/"+uid+"/"+item.uuid+"/"+val[2]);
                                                });
                                            }
                                        break;
                                        case "Wallbox2":
                                            switch(value) {
                                                case "start":
                                                    socket.send("jdev/sps/io/"+uid+"/allow/on");
                                                break;
                                                case "pause":
                                                    socket.send("jdev/sps/io/"+uid+"/allow/off");
                                                break;
                                                default:
                                                    if(value.includes("limit:"))
                                                        socket.send("jdev/sps/io/"+uid+"/manualLimit/"+value.replace("limit:",""));
                                                    if(value.includes("mode:"))
                                                        socket.send("jdev/sps/io/"+uid+"/setmode/"+value.replace("mode:",""));
                                                break;
                                            }
                                        break;
                                        case "AalSmartAlarm":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "Alarm":
                                            switch(value) {
                                                case "on":
                                                    socket.send("jdev/sps/io/"+uid+"/on");
                                                break;
                                                case "delayon":
                                                    socket.send("jdev/sps/io/"+uid+"/delayedon");
                                                break;
                                                case "off":
                                                    socket.send("jdev/sps/io/"+uid+"/off");
                                                break;
                                                case "confirm":
                                                    socket.send("jdev/sps/io/"+uid+"/quit");
                                                break;
                                                case "dismv:0":
                                                    socket.send("jdev/sps/io/"+uid+"/dismv/0");
                                                break;
                                                case "dismv:1":
                                                    socket.send("jdev/sps/io/"+uid+"/dismv/1");
                                                break;
                                            }
                                        break;
                                        case "AalEmergency":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "PulseAt":
                                            switch(value) {
                                                case "push":
                                                    socket.send("jdev/sps/io/"+uid+"/pulse");
                                                break;
                                            }
                                        break;
                                        case "CentralLightController":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "CentralJalousie":
                                            switch(value) {
                                                case "up":
                                                    Object.values(lxData.controls[uid].details.controls).forEach(function(u) {
                                                        socket.send("jdev/sps/io/"+u.uuid+"/FullUp");
                                                    });
                                                break;
                                                case "down":
                                                    Object.values(lxData.controls[uid].details.controls).forEach(function(u) {
                                                        socket.send("jdev/sps/io/"+u.uuid+"/FullDown");
                                                    });
                                                break;
                                            }
                                        break;
                                        case "ClimateController":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "LightControllerV2":
                                            if(value == "next")
                                                socket.send("jdev/sps/io/"+uid+"/plus");
                                            if(value.includes("setmood:"))
                                                socket.send("jdev/sps/io/"+uid+"/changeTo/"+value.replace("setmood:",""));
                                        break;
                                        case "AlarmClock":
                                            switch(value) {
                                                case "snooze":
                                                    socket.send("jdev/sps/io/"+uid+"/snooze");
                                                break;
                                                case "dismiss":
                                                    socket.send("jdev/sps/io/"+uid+"/dismiss");
                                                break;
                                            }
                                        break;
                                        case "Window":
                                            switch(value) {
                                                case "open":
                                                    socket.send("jdev/sps/io/"+uid+"/fullopen");
                                                break;
                                                case "close":
                                                    socket.send("jdev/sps/io/"+uid+"/fullclose");
                                                break;
                                                case "openstart":
                                                    socket.send("jdev/sps/io/"+uid+"/open/on");
                                                break;
                                                case "openstop":
                                                    socket.send("jdev/sps/io/"+uid+"/open/off");
                                                break;
                                                case "closestart":
                                                    socket.send("jdev/sps/io/"+uid+"/close/on");
                                                break;
                                                case "closestop":
                                                    socket.send("jdev/sps/io/"+uid+"/close/off");
                                                break;
                                            }
                                        break;
                                        case "Jalousie":
                                            switch(value) {
                                                case "up":
                                                    socket.send("jdev/sps/io/"+uid+"/FullUp");
                                                break;
                                                case "down":
                                                    socket.send("jdev/sps/io/"+uid+"/FullDown");
                                                break;
                                                case "upstart":
                                                    socket.send("jdev/sps/io/"+uid+"/up");
                                                break;
                                                case "upstop":
                                                    socket.send("jdev/sps/io/"+uid+"/UpOff");
                                                break;
                                                case "downstart":
                                                    socket.send("jdev/sps/io/"+uid+"/down");
                                                break;
                                                case "downstop":
                                                    socket.send("jdev/sps/io/"+uid+"/DownOff");
                                                break;
                                                case "shade":
                                                    socket.send("jdev/sps/io/"+uid+"/shade");
                                                break;
                                                case "autoon":
                                                    socket.send("jdev/sps/io/"+uid+"/auto");
                                                break;
                                                case "autooff":
                                                    socket.send("jdev/sps/io/"+uid+"/NoAuto");
                                                break;
                                            }
                                        break;
                                        case "Gate":
                                            switch(value) {
                                                case "up":
                                                    socket.send("jdev/sps/io/"+uid+"/open");
                                                break;
                                                case "down":
                                                    socket.send("jdev/sps/io/"+uid+"/close");
                                                break;
                                            }
                                        break;
                                        case "Ventilation":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "Radio":
                                            var current = controlValues[lxData.controls[uid].states.activeOutput];
                                            var lastX = 0;
                                            var lastY = Object.keys(lxData.controls[uid].details.outputs);
                                            lastX = lastY[lastY.length-1];
                                            switch(value) {
                                                case "plus":
                                                    if(current+1 <= lastX)
                                                        socket.send("jdev/sps/io/"+uid+"/"+(current+1));
                                                    else
                                                        socket.send("jdev/sps/io/"+uid+"/reset");
                                                break;
                                                case "minus":
                                                    if(current == 0)
                                                        socket.send("jdev/sps/io/"+uid+"/"+lastX);
                                                    else if(current-1 >= 1)
                                                        socket.send("jdev/sps/io/"+uid+"/"+(current-1));
                                                    else
                                                        socket.send("jdev/sps/io/"+uid+"/reset");
                                                break;
                                                default:
                                                    var value = value == "0" ? "reset" : value;
                                                    socket.send("jdev/sps/io/"+uid+"/"+value);
                                                break;
                                            }
                                        break;
                                        case "Remote":
                                            socket.send("jdev/sps/io/"+uid+"/"+value);
                                        break;
                                        case "NfcCodeTouch":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "Sauna":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "Intercom":
                                            
                                        break;
                                        case "Webpage":
                                            switch(value) {
                                                
                                            }
                                        break;
                                        case "CentralAudioZone":
                                            
                                        break;
                                        case "AudioZoneV2":
                                            
                                        break;
                                    }
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

                speechMicrophoneStream.on('data', data => {
                    if(speechRecognizer.acceptWaveform(data)) {
                        var sentence = speechRecognizer.result().text.toLowerCase();
                        console.log(sentence);
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
                    }
                });
                
                speechMicrophoneStream.on('audioProcessExitComplete', function() {
                    speechRecognizer.free();
                    speechModel.free();
                });
                
                process.on('SIGINT', function() {
                    speechMicrophone.stop();
                });
                
                speechMicrophone.start();

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