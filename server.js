import { WebSocketServer, WebSocket } from 'ws';
import http from 'http';
import LxCommunicator from "LxCommunicator";
import axios from 'axios';
import xmljs from 'xml-js';
import fs from 'fs';
import natural from 'natural';
import chalk from 'chalk';

log("INFO","Main Thread","Initializing varriables");

var clients = new Set();
var conf = {};
var weatherReadData = {};
var lxDt = {};
var lxValues = {};
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
            if(type === 2) {
                events.forEach(function(event) {
                    var uuid = event.uuid;
                    var value = event.value;
                    lxDt[uuid] = value;
                    clients.forEach(function(client) {
                        Object.keys(lxDt).forEach(function(uuid) {
                            client.send(JSON.stringify({ module: "loxone", type: "update", uuid: uuid, value: lxDt[uuid] }));
                            lxValues = { uuid: uuid, value: lxDt[uuid] };
                        });
                    });
                });
            }
        }
    };
    log("INFO","Loxone Thread","Listeners for receiving has been added successfully");

    var socket = new LxCommunicator.WebSocket(config);

    log("INFO","Loxone Thread","Trying to fetch settings from Loxone Miniserver");

    axios.get("http://"+lxAddr+"/data/LoxAPP3.json", {headers: {Authorization: "Basic "+Buffer.from(lxUser+':'+lxPass).toString('base64')}}).then(function(lxDataFull) {
        var lxData = lxDataFull.data;

        log("INFO","Loxone Thread","Settings from Loxone Miniserver fetched successfully");
        log("INFO","Loxone Thread","Configuring connection has been added successfully");
        log("INFO","Loxone Thread","Trying to create connection with Loxone Miniserver");

        socket.open(lxAddr, lxUser, lxPass).then(function() {
            socket.send("jdev/sps/enablebinstatusupdate").then(function(respons) {
                var len = Object.keys(lxData.controls).length;
                var currentPercent = 0;
                var currentLoop = 0;
                Object.keys(lxData.controls).forEach(function(uuid) {
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
                log("INFO","Interface Thread","Trying to create Web Interface listener");
                webServer.listen(80, () => {
                    log("INFO","Interface Thread","Web Interface listener has been created");
                    log("INFO","Interface Thread","Web Interface listener running on "+chalk.underline("http://localhost:80"));
                });
                    
                log("INFO","Loxone Thread","Connection with Loxone Miniserver has been established successfully");
                log("INFO","Main Thread","Trying to create WebSocket listener");

                var wss = new WebSocketServer({ port: 34987 });
                log("INFO","Main Thread","WebSocket listener is listening");
                log("INFO","Main Thread","Server has been fully started");

                wss.on('connection', function(ws) {
                    clients.add(ws);
                    log("INFO","Connection Thread","Client has connected ["+new Date().getTime().toString(16)+"]");

                    ws.send(JSON.stringify({ module: "loxone", type: "add", items: lxData }));
                    Object.keys(lxDt).forEach(function(uuid) {
                        ws.send(JSON.stringify({ module: "loxone", type: "update", uuid: uuid, value: lxDt[uuid] }));
                    });
                    if(conf["radioPlaying"] == 0) {
                        ws.send(JSON.stringify({ module: "radio", action: "pause" }));
                    } else {
                        ws.send(JSON.stringify({ module: "radio", action: "play" }));
                    }
                    var c_radio = conf["radioStations"][conf["radioStation"]-1];
                    ws.send(JSON.stringify({ module: "radio", action: "change", image: c_radio["image"], title: c_radio["name"] }));
                    ws.send(JSON.stringify({ module: "radio", action: "volume", value: conf["radioVolume"] }));
                    
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
                            case "radio":
                                if(dt["action"] == "play") {
                                    if(conf["radioPlaying"] == 0) {
                                        conf["radioPlaying"] = 1;
                                        sendMessage(JSON.stringify({ module: "radio", action: "play" }));
                                        play();
                                    } else {
                                        conf["radioPlaying"] = 0;
                                        sendMessage(JSON.stringify({ module: "radio", action: "pause" }));
                                        pause();
                                    }
                                } else if(dt["action"] == "back") {
                                    var current_radio = conf["radioStation"];
                                    if(current_radio > 1) {
                                        conf["radioStation"] = current_radio-1;
                                        var c_radio = conf["radioStations"][current_radio-2];
                                        stop();
                                        sendMessage(JSON.stringify({ module: "radio", action: "change", image: c_radio["image"], title: c_radio["name"] }));
                                        playAudioStream(c_radio[2]);
                                        if(conf["radioPlaying"] == 1) play();
                                    }
                                } else if(dt["action"] == "next") {
                                    var current_radio = conf["radioStation"];
                                    if(current_radio < conf["radioStations"].length) {
                                        conf["radioStation"] = current_radio+1;
                                        var c_radio = conf["radioStations"][current_radio];
                                        stop();
                                        sendMessage(JSON.stringify({ module: "radio", action: "change", image: c_radio["image"], title: c_radio["name"] }));
                                        playAudioStream(c_radio[2]);
                                        if(conf["radioPlaying"] == 1) play();
                                    }
                                } else if(dt["action"] == "volume") {
                                    if(typeof dt["value"] !== "undefined" && dt["value"] != null) {
                                        setVolume(parseFloat(dt["value"]));
                                        conf["radioVolume"] = parseFloat(dt["value"]);
                                        sendMessage(JSON.stringify({ module: "radio", action: "volume", value: dt["value"] }));
                                    }
                                } else {
                                    log("ERROR","Communication Thread","Accepted incorrent command from client");
                                    ws.send("ERROR:[NEPLATNÁ AKCE]");
                                }
                            break;
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
                                        log("INFO","Voice Thread","Recieved voice command to turn on the switch, {uuid:"+control.uuidAction+",state:on}");
                                    break;
                                    case "Switch_setOff":
                                        socket.send("jdev/sps/io/"+control.uuidAction+"/off");
                                        log("INFO","Voice Thread","Recieved voice command to turn off the switch, {uuid:"+control.uuidAction+",state:off}");
                                    break;
                                    case "Switch_say":
                                        if(lxValues[control.states.active])
                                            if(lxValues[control.states.active] == 1)
                                                sendToSpeech("Zapnuto");
                                            else
                                                sendToSpeech("Vypnuto");
                                        else
                                            sendToSpeech("Neznámo");
                                    break;
                                    case "EIBDimmer_say":
                                        if(lxValues[control.states.position])
                                            sendToSpeech(lxValues[control.states.position]+"%");
                                        else
                                            sendToSpeech("Neznámo");
                                    break;
                                    case "EIBDimmer_setOn":
                                        if(sentence.includes("%")) {
                                            var half = sentence.substring(0, sentence.lastIndexOf("%"));
                                            var percent = half.substring(half.lastIndexOf(" ")+1, half.length);
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/"+percent+".000000");
                                            log("INFO","Voice Thread","Recieved voice command to turn on the dimmer, percent detected changing, {uuid:"+control.uuidAction+",value:"+percent+"}");
                                        } else {
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/100.000000");
                                            log("INFO","Voice Thread","Recieved voice command to turn on the dimmer, {uuid:"+control.uuidAction+",value:"+percent+"}");
                                        }
                                    break;
                                    case "EIBDimmer_setOff":
                                        if(sentence.includes("%")) {
                                            var half = sentence.substring(0, sentence.lastIndexOf("%"));
                                            var percent = half.substring(half.lastIndexOf(" ")+1, half.length);
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/"+percent+".000000");
                                            log("INFO","Voice Thread","Recieved voice command to turn off the dimmer, percent detected changing, {uuid:"+control.uuidAction+",value:"+percent+"}");
                                        } else {
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/0.000000");
                                            log("INFO","Voice Thread","Recieved voice command to turn off the dimmer, {uuid:"+control.uuidAction+",value:"+percent+"}");
                                        }
                                    break;
                                    case "EIBDimmer_setChange":
                                        if(sentence.includes("%")) {
                                            var half = sentence.substring(0, sentence.lastIndexOf("%"));
                                            var percent = half.substring(half.lastIndexOf(" ")+1, half.length);
                                            socket.send("jdev/sps/io/"+control.uuidAction+"/"+percent+".000000");
                                            log("INFO","Voice Thread","Recieved voice command to change dimmer value, {uuid:"+control.uuidAction+",value:"+percent+"}");
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
                                    return bestMatch;
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


                function sendMessage(message) {
                    clients.forEach((client) => {
                        if(client.readyState === WebSocket.OPEN) {
                            client.send(message);
                        }
                    });
                }
            });
        });
    });
}

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

async function setVolume(volume) {
    await sendVlcRequest("status.xml?command=volume&val="+(512*volume));
}

async function play() {
    await sendVlcRequest("status.xml?command=pl_play");
}

async function pause() {
    await sendVlcRequest("status.xml?command=pl_pause");
}

async function stop() {
    await sendVlcRequest("status.xml?command=pl_stop");
    await sendVlcRequest("status.xml?command=pl_empty");
}

async function playAudioStream(streamUrl) {
    await sendVlcRequest("status.xml?command=in_enqueue&input="+encodeURIComponent(streamUrl));
}

async function getLastPlayList() {
    await sendVlcRequest("playlist.xml").then(function(res) {
        var d = JSON.parse(xmljs.xml2json(res.data, {compact: true,space: 4}))["node"]["node"][0]["leaf"];
        console.log(d[d.length-1]["_attributes"]["id"]);
    });
}

async function sendVlcRequest(url) {
    try { await axios.get("http://"+conf["vlcAddr"]+"/requests/"+url, { auth: { username: '', password: conf["vlcPass"] }}); } catch(e) {}
}