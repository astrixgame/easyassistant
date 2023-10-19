import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import LxCommunicator from "LxCommunicator";
import fs from 'fs';
import readline from 'readline';

log("INFO","Main Thread","Initializing varriables");

var socket;
var clients = new Set();
var conf = {};
var languageSet = {};
var server;
var controlControlsIds = {};
var controlRoomsIds = {};
var controlCatsIds = {};
var lxAlias = {};
var lxData = {};
var idSeed = 1;
var controlValues = {};
var lxNamesAlias = {};
var lxNamesIgnore = [];
var removedWordFromName = [];
var userInput = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

log("INFO","Main Thread","Varriables has been inilialized");
log("INFO","Main Thread","Loading configurations files");

fs.readFile("config.json", {encoding: 'utf-8'}, function(err, data) {
    conf = JSON.parse(data);
    log("INFO","Main Thread","Configurations files has been loaded");
    log("INFO","Main Thread","Loading server cache and data files");

    lxNamesAlias = conf.hub.controlNameAlias;
    lxNamesIgnore = conf.hub.controlIgnore;
    removedWordFromName = conf.hub.removedWordFromName;

    log("INFO","Main Thread","Loading language file");
    fs.readFile("languages/"+conf.language+".json", {encoding: 'utf-8'}, function(err, lan) {
        languageSet = JSON.parse(lan);
        log("INFO","Main Thread","Language file has been loaded");
    });

    log("INFO","Main Thread","Creating natural language processing model");
    log("INFO","Main Thread","Adding languages to language processing model");
    log("INFO","Main Thread","Natural language has been created");

    log("INFO","Main Thread","Server cache and data files has been loaded");

    switch(conf.hub.type) {
        case "loxone":
            log("INFO","Loxone Thread","Trying to establish connection with Loxone Miniserver");
            loxoneConnection(conf.hub.address, conf.hub.user, conf.hub.password);
        break;
    }
});

async function loxoneConnection(lxAddr, lxUser, lxPass) {
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
    log("INFO","Loxone Thread","Listeners for receiving has been added successfully");

    socket = new LxCommunicator.WebSocket(config);

    log("INFO","Loxone Thread","Trying to create connection with Loxone Miniserver");
    await socket.open(lxAddr, lxUser, lxPass).then(async function() {
        log("INFO","Loxone Thread","Connection with Loxone Miniserver has been established successfully");

        log("INFO","Loxone Thread","Trying to fetch data from Loxone Miniserver");
        socket.send("data/LoxAPP3.json").then(function(lxDataFull) {
            lxData = JSON.parse(lxDataFull);
            lxNamesIgnore.forEach(function(uuid) {
                delete lxData.controls[uuid];
            });

            log("INFO","Loxone Thread","Settings from Loxone Miniserver fetched successfully");
            log("INFO","Loxone Thread","Configuring connection has been added successfully");

            log("INFO","Loxone Thread","Creating status update listener");
            socket.send("jdev/sps/enablebinstatusupdate").then(async function() {
                log("INFO","Loxone Thread","Status update listener has been created");
                Object.keys(lxData.controls).forEach(async function(uuid) {
                    if(lxData.controls[uuid].states)
                        Object.values(lxData.controls[uuid].states).forEach(function(it) {
                            lxAlias[it] = uuid;
                        });
                });
            });
        });
    });

    createNetServer();
}

function createNetServer() {
    log("INFO","Interface Thread","Initializing Web interface listener");
    server = http.createServer((req, res) => {
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
                res.writeHead(500);
                res.end(`Server Error: ${error.code}`);
            } else {
                res.writeHead(200, { 'Content-Type': contentType });
                res.end(content, 'utf-8');
            }
        });
    });
    log("INFO","Interface Thread","Web interface listener has been initialized");

    log("INFO","Interface Thread","Trying to create Web Interface listener");
    server.listen(80, () => {
        log("INFO","Interface Thread","Web Interface listener running on http://localhost:80");
    });

    log("INFO","Main Thread","Trying to create WebSocket listener");
    var wss = new WebSocketServer({ server: server });

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

        ws.on('message', function(data) {
            var dt = JSON.parse(new Buffer.from(data).toString());
            switch(dt["module"]) {
                case "control":
                    if(dt["action"] == "change")
                        Object.keys(controlControlsIds).forEach(function(v) {
                            if(dt["uuid"] == controlControlsIds[v])
                                proccessInputCommand(dt["type"], v, dt["value"], true);
                        });
                break;
                case "voice":
                    console.log(dt["value"]);
                    processSentence(dt["value"]);
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
}

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
            case "ColorPickerV2":

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

function processSentence(sentence) {
    var fin = false;
    var str = [];
    str[4] = 0;
    if(sentence.toLowerCase().includes("hej") || sentence.toLowerCase().includes("hrají") || true) {
        Object.keys(lxData.controls).forEach(async function(uuid) {
            var control = lxData.controls[uuid];
            var name = (lxNamesAlias[uuid] ? lxNamesAlias[uuid] : "")+" "+control.name.toLowerCase();
            removedWordFromName.forEach(function(i) {
                name = name.toLowerCase().replace(i, "");
            });
            Object.keys(languageSet.voice.control[control.type]).forEach(function(type) {
                languageSet.voice.control[control.type][type].forEach(function(item) {
                    var has = true;
                    if(!fin)
                        item.replace("{_name_}", name).split(" ").forEach(function(i) {
                            if(!sentence.includes(i) && has)
                                has = false;
                            else {
                                str[0] = control.type;
                                str[1] = uuid;
                                str[2] = type;
                                str[3] = item.replace("{_name_}", name);
                            }
                        });
                    if(has)
                        fin = true;
                    else {
                        str[5] = jaroWinkler(sentence, item.replace("{_name_}", name), false);
                        if(str[5] > str[4]) {
                            str[0] = control.type;
                            str[1] = uuid;
                            str[2] = type;
                            str[3] = item.replace("{_name_}", name);
                            str[4] = str[5];
                        }
                    }
                    //console.log(str[5]+" - "+sentence+" - "+item.replace("{_name_}", name));
                });
            });
        });
        log("INFO","Voice Thread","Proccessing sentence "+sentence+" as "+str[3]+" detected command "+str[2]+" for uuid "+str[1]);
        proccessInputCommand(str[0], str[1], str[2]+":"+sentence, false);
    }
}

function proccessInputCommand(type, uuid, command, direct) {
    var sentence = "";
    if(!direct) {
        var tmp = command.split(":")
        command = tmp[0];
        sentence = tmp[1];
    }
    switch(type) {
        case "InfoOnlyDigital":
            if(!direct) {
                switch(command) {
                    case "say":
                        if(lxData.controls[uuid].details && lxData.controls[uuid].details.on) {
                            sendToSpeech(findDuplicateWords(sentence, lxData.controls[uuid].name)+(controlValues[lxData.controls[uuid].states.active] == 1 ? " je "+lxData.controls[uuid].details.on : " je "+lxData.controls[uuid].details.off));
                        } else {
                            var endOfWord = getShapeWord(findDuplicateWords(sentence, lxData.controls[uuid].name));
                            sendToSpeech(findDuplicateWords(sentence, lxData.controls[uuid].name)+(controlValues[lxData.controls[uuid].states.active] == 1 ? " je zapnut"+endOfWord : " je vypnut"+endOfWord));
                        }
                    break;
                    case "ison":
                        if(lxData.controls[uuid].details && lxData.controls[uuid].details.on) {
                            sendToSpeech((controlValues[lxData.controls[uuid].states.active] == 1 ? "ano je "+lxData.controls[uuid].details.on : "ne je "+lxData.controls[uuid].details.off));
                        } else {
                            var endOfWord = getShapeWord(findDuplicateWords(sentence, lxData.controls[uuid].name));
                            sendToSpeech((controlValues[lxData.controls[uuid].states.active] == 1 ? "ano je zapnut"+endOfWord : "ne je vypnut"+endOfWord));
                        }
                    break;
                    case "isoff":
                        if(lxData.controls[uuid].details && lxData.controls[uuid].details.on) {
                            sendToSpeech((controlValues[lxData.controls[uuid].states.active] == 1 ? "ne je "+lxData.controls[uuid].details.on : "ano je "+lxData.controls[uuid].details.off));
                        } else {
                            var endOfWord = getShapeWord(findDuplicateWords(sentence, lxData.controls[uuid].name));
                            sendToSpeech((controlValues[lxData.controls[uuid].states.active] == 1 ? "ne je zapnut"+endOfWord : "ano je vypnut"+endOfWord));
                        }
                    break;
                }
            }
        break;
        case "InfoOnlyAnalog":
            if(!direct) {
                switch(command) {
                    case "say":
                        sendToSpeech((lxData.controls[uuid].details && lxData.controls[uuid].details.format ? formatNumber(lxData.controls[uuid].details.format, controlValues[lxData.controls[uuid].states.value]) : controlValues[lxData.controls[uuid].states.value]));
                    break;
                }
            }
        break;
        case "TextState":
            if(!direct) {
                switch(command) {
                    case "say":
                        sendToSpeech(lxData.controls[uuid].name+" je "+controlValues[lxData.controls[uuid].states.textAndIcon]);
                    break;
                }
            }
        break;
        case "Meter":
            if(!direct) {
                switch(command) {
                    case "say":
                        switch(mainItem.details.type ? mainItem.details.type : "_") {
                            case "storage":
                                
                            break;
                            default:
                                
                            break;
                        }
                    break;
                    case "total":

                    break;
                    case "actual":

                    break;
                }
            }
        break;
        case "Switch":
            if(direct) {
                switch(command) {
                    case 0:
                        socket.send("jdev/sps/io/"+uuid+"/off");
                    break;
                    case 1:
                        socket.send("jdev/sps/io/"+uuid+"/on");
                    break;
                }
            } else {
                switch(command) {
                    case "say":
                        var endOfWord = getShapeWord(findDuplicateWords(sentence, lxData.controls[uuid].name));
                        sendToSpeech(findDuplicateWords(sentence, lxData.controls[uuid].name)+" je "+(controlValues[lxData.controls[uuid].states.active] == 1 ? "zapnut"+endOfWord : "vypnut"+endOfWord));
                    break;
                    case "ison":
                        var endOfWord = getShapeWord(findDuplicateWords(sentence, lxData.controls[uuid].name));
                        sendToSpeech((controlValues[lxData.controls[uuid].states.active] == 1 ? "ano je zapnut"+endOfWord : "ne je vypnut"+endOfWord));
                    break;
                    case "isoff":
                        var endOfWord = getShapeWord(findDuplicateWords(sentence, lxData.controls[uuid].name));
                        sendToSpeech((controlValues[lxData.controls[uuid].states.active] == 1 ? "ne je zapnut"+endOfWord : "ano je vypnut"+endOfWord));
                    break;
                    case "on":
                        sendToSpeech("Zapnuto");
                        socket.send("jdev/sps/io/"+uuid+"/on");
                    break;
                    case "off":
                        sendToSpeech("Vypnuto");
                        socket.send("jdev/sps/io/"+uuid+"/off");
                    break;
                }
            }
        break;
        case "EIBDimmer":
            if(direct) {
                if(typeof command == "string" && command.includes("%"))
                    socket.send("jdev/sps/io/"+uuid+"/"+command.replace("%",""));
                else
                    if(command == 1)
                        socket.send("jdev/sps/io/"+uuid+"/on");
                    else
                        socket.send("jdev/sps/io/"+uuid+"/off");
            } else {
                switch(command) {
                    case "say":

                    break;
                    case "ison":
                        
                    break;
                    case "isoff":

                    break;
                    case "on":
                        sendToSpeech("Zapnuto");
                        socket.send("jdev/sps/io/"+uuid+"/on");
                    break;
                    case "off":
                        sendToSpeech("Vypnuto");
                        socket.send("jdev/sps/io/"+uuid+"/off");
                    break;
                    case "change":
                        sendToSpeech("Nastaveno");
                        socket.send("jdev/sps/io/"+uuid+"/"+sentence.match(/\d/g).join(""));
                    break;
                }
            }
        break;
        case "IRoomControllerV2":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "TimedSwitch":
            if(direct) {
                switch(command) {
                    case "push":
                        socket.send("jdev/sps/io/"+uuid+"/pulse");
                    break;
                }
            } else {

            }
        break;
        case "LeftRightAnalog":
            if(direct) {
                var current = controlValues[lxData.controls[uuid].states.value];
                var step = lxData.controls[uuid].details.step;
                var min = lxData.controls[uuid].details.min;
                var max = lxData.controls[uuid].details.max;
                switch(command) {
                    case "left":
                        if(current-step >= min)
                            socket.send("jdev/sps/io/"+uuid+"/"+(current-step));
                    break;
                    case "right":
                        if(current+step <= max)
                            socket.send("jdev/sps/io/"+uuid+"/"+(current+step));
                    break;
                }
            } else {

            }
        break;
        case "Pushbutton":
            if(direct) {
                switch(command) {
                    case "push":
                        socket.send("jdev/sps/io/"+uuid+"/pulse");
                    break;
                }
            } else {

            }
        break;
        case "Irrigation":
            if(direct) {
                socket.send("jdev/sps/io/"+uuid+"/"+command);
            } else {

            }
        break;
        case "SmokeAlarm":
            if(direct) {
                switch(command) {
                    case "confirm":
                        socket.send("jdev/sps/io/"+uuid+"/confirm");
                    break;
                    case "mute":
                        socket.send("jdev/sps/io/"+uuid+"/mute");
                    break;
                    default:
                        if(command.includes("service:"))
                            socket.send("jdev/sps/io/"+uuid+"/"+command.replace("service:",""));
                    break;
                }
            } else {

            }
        break;
        case "EnergyManager2":
            if(direct) {
                if(command.includes("minstorage:"))
                    socket.send("jdev/sps/io/"+uuid+"/setMinSoc/"+command.replace("minstorage:",""));
                if(command.includes("maxstorage:"))
                    socket.send("jdev/sps/io/"+uuid+"/setMaxSpwr/"+command.replace("maxstorage:",""));
                if(command.includes("mode:")) {
                    var val = command.split(":");
                    JSON.parse(controlValues[lxData.controls[uuid].states.loads]).forEach(function(item) {
                        if(item.id.toString() == val[1])
                            socket.send("jdev/sps/io/"+uuid+"/"+item.uuid+"/"+val[2]);
                    });
                }
            } else {

            }
        break;
        case "Wallbox2":
            if(direct) {
                switch(command) {
                    case "start":
                        socket.send("jdev/sps/io/"+uuid+"/allow/on");
                    break;
                    case "pause":
                        socket.send("jdev/sps/io/"+uuid+"/allow/off");
                    break;
                    default:
                        if(command.includes("limit:"))
                            socket.send("jdev/sps/io/"+uuid+"/manualLimit/"+command.replace("limit:",""));
                        if(command.includes("mode:"))
                            socket.send("jdev/sps/io/"+uuid+"/setmode/"+command.replace("mode:",""));
                    break;
                }
            } else {

            }
        break;
        case "AalSmartAlarm":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "Alarm":
            if(direct) {
                switch(command) {
                    case "on":
                        socket.send("jdev/sps/io/"+uuid+"/on");
                    break;
                    case "delayon":
                        socket.send("jdev/sps/io/"+uuid+"/delayedon");
                    break;
                    case "off":
                        socket.send("jdev/sps/io/"+uuid+"/off");
                    break;
                    case "confirm":
                        socket.send("jdev/sps/io/"+uuid+"/quit");
                    break;
                    case "dismv:0":
                        socket.send("jdev/sps/io/"+uuid+"/dismv/0");
                    break;
                    case "dismv:1":
                        socket.send("jdev/sps/io/"+uuid+"/dismv/1");
                    break;
                }
            } else {

            }
        break;
        case "AalEmergency":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "PulseAt":
            if(direct) {
                switch(command) {
                    case "push":
                        socket.send("jdev/sps/io/"+uuid+"/pulse");
                    break;
                }
            } else {

            }
        break;
        case "CentralLightController":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "CentralJalousie":
            if(direct) {
                switch(command) {
                    case "up":
                        Object.values(lxData.controls[uuid].details.controls).forEach(function(u) {
                            socket.send("jdev/sps/io/"+u.uuid+"/FullUp");
                        });
                    break;
                    case "down":
                        Object.values(lxData.controls[uuid].details.controls).forEach(function(u) {
                            socket.send("jdev/sps/io/"+u.uuid+"/FullDown");
                        });
                    break;
                }
            } else {

            }
        break;
        case "ClimateController":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "LightControllerV2":
            if(direct) {
                if(command == "next")
                    socket.send("jdev/sps/io/"+uuid+"/plus");
                if(command.includes("setmood:"))
                    socket.send("jdev/sps/io/"+uuid+"/changeTo/"+command.replace("setmood:",""));
            } else {

            }
        break;
        case "ColorPickerV2":
            if(direct) {
                
            } else {

            }
        break;
        case "AlarmClock":
            if(direct) {
                switch(command) {
                    case "snooze":
                        socket.send("jdev/sps/io/"+uuid+"/snooze");
                    break;
                    case "dismiss":
                        socket.send("jdev/sps/io/"+uuid+"/dismiss");
                    break;
                }
            } else {

            }
        break;
        case "Window":
            if(direct) {
                switch(command) {
                    case "open":
                        socket.send("jdev/sps/io/"+uuid+"/fullopen");
                    break;
                    case "close":
                        socket.send("jdev/sps/io/"+uuid+"/fullclose");
                    break;
                    case "openstart":
                        socket.send("jdev/sps/io/"+uuid+"/open/on");
                    break;
                    case "openstop":
                        socket.send("jdev/sps/io/"+uuid+"/open/off");
                    break;
                    case "closestart":
                        socket.send("jdev/sps/io/"+uuid+"/close/on");
                    break;
                    case "closestop":
                        socket.send("jdev/sps/io/"+uuid+"/close/off");
                    break;
                }
            } else {

            }
        break;
        case "Jalousie":
            if(direct) {
                switch(command) {
                    case "up":
                        socket.send("jdev/sps/io/"+uuid+"/FullUp");
                    break;
                    case "down":
                        socket.send("jdev/sps/io/"+uuid+"/FullDown");
                    break;
                    case "upstart":
                        socket.send("jdev/sps/io/"+uuid+"/up");
                    break;
                    case "upstop":
                        socket.send("jdev/sps/io/"+uuid+"/UpOff");
                    break;
                    case "downstart":
                        socket.send("jdev/sps/io/"+uuid+"/down");
                    break;
                    case "downstop":
                        socket.send("jdev/sps/io/"+uuid+"/DownOff");
                    break;
                    case "shade":
                        socket.send("jdev/sps/io/"+uuid+"/shade");
                    break;
                    case "autoon":
                        socket.send("jdev/sps/io/"+uuid+"/auto");
                    break;
                    case "autooff":
                        socket.send("jdev/sps/io/"+uuid+"/NoAuto");
                    break;
                }
            } else {

            }
        break;
        case "Gate":
            if(direct) {
                switch(command) {
                    case "up":
                        socket.send("jdev/sps/io/"+uuid+"/open");
                    break;
                    case "down":
                        socket.send("jdev/sps/io/"+uuid+"/close");
                    break;
                }
            } else {

            }
        break;
        case "Ventilation":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "Radio":
            if(direct) {
                var current = controlValues[lxData.controls[uuid].states.activeOutput];
                var lastX = 0;
                var lastY = Object.keys(lxData.controls[uuid].details.outputs);
                lastX = lastY[lastY.length-1];
                switch(command) {
                    case "plus":
                        if(current+1 <= lastX)
                            socket.send("jdev/sps/io/"+uuid+"/"+(current+1));
                        else
                            socket.send("jdev/sps/io/"+uuid+"/reset");
                    break;
                    case "minus":
                        if(current == 0)
                            socket.send("jdev/sps/io/"+uuid+"/"+lastX);
                        else if(current-1 >= 1)
                            socket.send("jdev/sps/io/"+uuid+"/"+(current-1));
                        else
                            socket.send("jdev/sps/io/"+uuid+"/reset");
                    break;
                    default:
                        var value = command == "0" ? "reset" : command;
                        socket.send("jdev/sps/io/"+uuid+"/"+value);
                    break;
                }
            } else {

            }
        break;
        case "Remote":
            if(direct) {
                socket.send("jdev/sps/io/"+uuid+"/"+command);
            } else {

            }
        break;
        case "NfcCodeTouch":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "Sauna":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "Intercom":
            if(direct) {
                
            } else {

            }
            
        break;
        case "Webpage":
            if(direct) {
                switch(command) {
                
                }
            } else {

            }
        break;
        case "CentralAudioZone":
            if(direct) {
                
            } else {

            }
        break;
        case "AudioZoneV2":
            if(direct) {
                
            } else {

            }
        break;
    }
}

function sendMessage(message) {
    clients.forEach((client) => {
        if(client.readyState === WebSocket.OPEN) {
            client.send(message);
        }
    });
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
promptUser();
function promptUser() {
    userInput.question('', (commandandargs) => {
        fs.appendFile("server.log", ""+commandandargs+"\n", function() {});
        var all = commandandargs.split(" ");
        var command = all[0];
        all[0] = "";
        var args = all.filter((arg) => arg !== "");
        switch(command) {
            case "stop":
                process.exit(0);
            break;
            case "sentence":
                processSentence(args.join(" "));
            break;
            default:
                log("INFO","Console Thread","Command '"+command+"' does not exist!");
            break;
        }
        promptUser();
    });
}
/*
function jaroWinkler(x, y, caseSensitive = false) {
    var s1 = [], s2 = [], s3 = [], s4 = [];
    if(!caseSensitive)
        s1 = x.toLowerCase().split(""), s2 = y.toLowerCase().split("");
    else
        s1 = x.split(""), s2 = y.split("");
    for(var z1 = x.length;z1 >= 0;z1--)
        for(var z2 = y.length;z2 >= 0;z2--)
            if(z2 == s2.lastIndexOf(x[z1]) && s3[z1] != x[z1])
                s2.splice(s2.lastIndexOf(s3[z1] = x[z1]), 1);
    for(var z2 = y.length;z2 >= 0;z2--)
        for(var z1 = x.length;z1 >= 0;z1--)
            if(z1 == s1.lastIndexOf(y[z2]) && s4[z2] != y[z2])
                s1.splice(s1.lastIndexOf(s4[z2] = y[z2]), 1);
    s3 = s3.filter(function(a) { return a != null; });
    s4 = s4.filter(function(a) { return a != null; });
    var m = s3.length;
    var n = 0;
    for(var z = 0;z < m;z++)
        if(s3[z] != s4[z])
            n++;
    if(m > 0)
        return 1/3*(m/x.length+m/y.length+(m-n/2)/m);
    return 0;
}*/

function jaroWinkler(x, y, caseSensitive = false) {
    if(!caseSensitive) {
        x = x.toLowerCase();
        y = y.toLowerCase();
    }
    var maxLen = Math.max(x.length, y.length);
    var matchWindow = Math.floor(maxLen / 2) - 1;
    var xMatches = new Array(x.length).fill(false);
    var yMatches = new Array(y.length).fill(false);
    var commonChars = 0;
    for(var i = 0; i < x.length; i++) {
        var start = Math.max(0, i - matchWindow);
        var end = Math.min(i + matchWindow + 1, y.length);
        for(var j = start; j < end; j++) {
            if(!yMatches[j] && x[i] === y[j]) {
                xMatches[i] = true;
                yMatches[j] = true;
                commonChars++;
                break;
            }
        }
    }
    if(commonChars === 0)
        return 0;
    var transpositions = 0;
    var k = 0;
    for(var i = 0; i < x.length; i++) {
        if(xMatches[i]) {
            while(!yMatches[k]) k++;
            if(x[i] !== y[k])
                transpositions++;
            k++;
        }
    }
    var jaro = ((commonChars / x.length + commonChars / y.length + (commonChars - transpositions / 2) / commonChars) / 3) + Math.min(4, Math.min(x.length, y.length));
    return jaro + prefixLength * 0.1 * (1 - jaro);
}

function findDuplicateWords(sentence1, sentence2) {
    var words = [];
    sentence1 = sentence1.toLowerCase().split(" ");
    sentence2 = sentence2.toLowerCase().split(" ");
    sentence1.forEach(function(word) {
        if(sentence2.includes(word))
            words.push(word);
    });
    sentence2.forEach(function(word) {
        if(sentence1.includes(word) && !words.includes(word))
            words.push(word);
    });
    return words.join(" ");
}

function getShapeWord(word) {
    if(word && word != "") {
        var lettersToLetters = {
            "a": "á",
            "o": "é",
            "č": "ý",
            "e": "á",
            "š": "á",
            "j": "ý",
            "r": "ý",
            "z": "ý",
            "y": "é",
            "č": "ý"
        };
        return lettersToLetters[word.charAt(word.length-1)];
    }
    return "";
}

async function sendToSpeech(text) {
    console.log(text);
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
    console.log("["+fDate+"] ["+level+"] ["+module+"] "+text);
}

process.on('exit', function(code) {
    log("INFO","Main Thread","Server shutdown requested");
});