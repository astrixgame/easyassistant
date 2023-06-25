import { WebSocketServer, WebSocket } from 'ws';
import gTTS from 'gtts';
import * as mysql from 'mysql';
import axios from 'axios';
import xmljs from 'xml-js';
import fs from 'fs';
import LxCommunicator from "LxCommunicator";

var lxAddr = "192.168.5.205:8080";
var lxUser = "Daniel";
var lxPass = "Minecraft96";

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "assistant"
});

var clients = new Set();

con.connect(function(err) {
    var aliases;
    var lxDt = {};

    log("INFO","Main Thread","Connection with database (MySQL) is established successfully");
    log("INFO","Loxone Thread","Configuring connection with Loxone Miniserver");

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
        log("INFO","Loxone Thread","Settings from Loxone Miniserver fetched successfully");
        log("INFO","Loxone Thread","Configuring connection has been added successfully");
        log("INFO","Loxone Thread","Trying to create connection with Loxone Miniserver");

        socket.open(lxAddr, lxUser, lxPass).then(function() {
            socket.send("jdev/sps/enablebinstatusupdate").then(function(respons) {
                /*
                ##################################################
                ##################################################
                
                                    MAIN THREAD
        
                ##################################################
                ##################################################
                */

                var lxData = lxDataFull.data;
                
                log("INFO","Loxone Thread","Connection with Loxone Miniserver has been established successfully");
                log("INFO","Main Thread","Trying to create WebSocket listener on port 34987");

                var wss = new WebSocketServer({ port: 34987 });
                log("INFO","Main Thread","WebSocket listener is listening on port 34987");

                wss.on('connection', function(ws) {

                    clients.add(ws);
                    log("INFO","Connection Thread","Client has connected");
                    ws.send(JSON.stringify({ module: "loxone", type: "add", items: lxData }));
                    Object.keys(lxDt).forEach(function(uuid) {
                        ws.send(JSON.stringify({ module: "loxone", type: "update", uuid: uuid, value: lxDt[uuid] }));
                    });
                    sql_query("SELECT v FROM configuration WHERE k='radio_playing';").then(function(result) {
                        if(result[0]["v"] == "no") {
                            ws.send(JSON.stringify({ module: "radio", action: "pause" }));
                        } else {
                            ws.send(JSON.stringify({ module: "radio", action: "play" }));
                        }
                    });
                    sql_query("SELECT v FROM configuration WHERE k='radio_station';").then(function(result) {
                        sql_query("SELECT * FROM radio_stations WHERE id="+result[0]["v"]+";").then(function(result1) {
                            ws.send(JSON.stringify({ module: "radio", action: "change", image: result1[0]["image"], title: result1[0]["name"] }));
                        });
                    });
                    sql_query("SELECT v FROM configuration WHERE k='radio_volume';").then(function(result) {
                        ws.send(JSON.stringify({ module: "radio", action: "volume", value: result[0]["v"] }));
                    });
                    fs.readFile("forecast.json", {encoding: 'utf-8'}, function(err,data){
                        var weatherObject = JSON.parse(data);
                        var sunrise = new Date(weatherObject["city"]["sunrise"]*1000);
                        var sunset = new Date(weatherObject["city"]["sunset"]*1000);
                        sunrise = (sunrise.getHours() < 10 ? "0"+sunrise.getHours() : sunrise.getHours())+":"+(sunrise.getMinutes() < 10 ? "0"+sunrise.getMinutes() : sunrise.getMinutes());
                        sunset = (sunset.getHours() < 10 ? "0"+sunset.getHours() : sunset.getHours())+":"+(sunset.getMinutes() < 10 ? "0"+sunset.getMinutes() : sunset.getMinutes());
                        var weatherData = [
                            { icon: getIcon(weatherObject["list"][0]["weather"][0]["icon"]), temperature: Math.round(weatherObject["list"][0]["main"]["temp"])/10, feeltemperature: Math.round(weatherObject["list"][0]["main"]["feels_like"])/10, pressure: weatherObject["list"][0]["main"]["pressure"], precip: weatherObject["list"][0]["pop"], humidity: weatherObject["list"][0]["main"]["humidity"], clouds: weatherObject["list"][0]["clouds"]["all"], windspeed: weatherObject["list"][0]["wind"]["speed"], winddir: getWindDir(weatherObject["list"][0]["wind"]["deg"]), sunrise: sunrise, sunset: sunset },
                            { icon: getIcon(weatherObject["list"][1]["weather"][0]["icon"]), temperature: Math.round(weatherObject["list"][1]["main"]["temp"])/10, feeltemperature: Math.round(weatherObject["list"][4]["main"]["feels_like"])/10, pressure: weatherObject["list"][1]["main"]["pressure"], precip: weatherObject["list"][1]["pop"], humidity: weatherObject["list"][1]["main"]["humidity"], clouds: weatherObject["list"][1]["clouds"]["all"], windspeed: weatherObject["list"][1]["wind"]["speed"], winddir: getWindDir(weatherObject["list"][1]["wind"]["deg"]), sunrise: sunrise, sunset: sunset },
                            { icon: getIcon(weatherObject["list"][5]["weather"][0]["icon"]), temperature: Math.round(weatherObject["list"][5]["main"]["temp"])/10, feeltemperature: Math.round(weatherObject["list"][5]["main"]["feels_like"])/10, pressure: weatherObject["list"][5]["main"]["pressure"], precip: weatherObject["list"][5]["pop"], humidity: weatherObject["list"][5]["main"]["humidity"], clouds: weatherObject["list"][5]["clouds"]["all"], windspeed: weatherObject["list"][5]["wind"]["speed"], winddir: getWindDir(weatherObject["list"][5]["wind"]["deg"]), sunrise: sunrise, sunset: sunset },
                            { icon: getIcon(weatherObject["list"][12]["weather"][0]["icon"]), temperature: Math.round(weatherObject["list"][12]["main"]["temp"])/10, feeltemperature: Math.round(weatherObject["list"][12]["main"]["feels_like"])/10, pressure: weatherObject["list"][12]["main"]["pressure"], precip: weatherObject["list"][12]["pop"], humidity: weatherObject["list"][12]["main"]["humidity"], clouds: weatherObject["list"][12]["clouds"]["all"], windspeed: weatherObject["list"][12]["wind"]["speed"], winddir: getWindDir(weatherObject["list"][12]["wind"]["deg"]), sunrise: sunrise, sunset: sunset }
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
                    });

                    ws.on('message', function(data) {
                        var dt = JSON.parse(new Buffer.from(data).toString());
                        switch(dt["module"]) {
                            case "radio":
                                if(dt["action"] == "play") {
                                    sql_query("SELECT v FROM configuration WHERE k='radio_playing';").then(function(result) {
                                        if(result[0]["v"] == "no") {
                                            setConfig("radio_playing","yes");
                                            sendMessage(JSON.stringify({ module: "radio", action: "play" }));
                                            play();
                                        } else {
                                            setConfig("radio_playing","no");
                                            sendMessage(JSON.stringify({ module: "radio", action: "pause" }));
                                            pause();
                                        }
                                    });
                                } else if(dt["action"] == "back") {
                                    sql_query("SELECT v FROM configuration WHERE k='radio_station';").then(function(result1) {
                                        var current_radio = parseInt(result1[0]["v"]);
                                        if(current_radio > 1) {
                                            setConfig("radio_station",""+(current_radio-1));
                                            sql_query("SELECT * FROM radio_stations WHERE id="+(current_radio-1)+";").then(function(result2) {
                                                stop();
                                                clearpl();
                                                sendMessage(JSON.stringify({ module: "radio", action: "change", image: result2[0]["image"], title: result2[0]["name"] }));
                                                playAudioStream(result2[0]["link"]);
                                                sql_query("SELECT v FROM configuration WHERE k='radio_playing';").then(function(result) {
                                                    if(result[0]["v"] == "yes") {
                                                        play();
                                                    }
                                                });
                                            });
                                        }
                                    });
                                } else if(dt["action"] == "next") {
                                    sql_query("SELECT COUNT(*) FROM radio_stations;").then(function(result) {
                                        sql_query("SELECT v FROM configuration WHERE k='radio_station';").then(function(result1) {
                                            var current_radio = parseInt(result1[0]["v"]);
                                            if(current_radio < parseInt(result[0]["COUNT(*)"])) {
                                                setConfig("radio_station",""+(current_radio+1));
                                                sql_query("SELECT * FROM radio_stations WHERE id="+(current_radio+1)+";").then(function(result2) {
                                                    stop();
                                                    clearpl();
                                                    sendMessage(JSON.stringify({ module: "radio", action: "change", image: result2[0]["image"], title: result2[0]["name"] }));
                                                    playAudioStream(result2[0]["link"]);
                                                    sql_query("SELECT v FROM configuration WHERE k='radio_playing';").then(function(result) {
                                                        if(result[0]["v"] == "yes") {
                                                            play();
                                                        }
                                                    });
                                                });
                                            }
                                        });
                                    });
                                } else if(dt["action"] == "volume") {
                                    if(typeof dt["value"] !== "undefined" && dt["value"] != null) {
                                        setVolume(parseFloat(dt["value"]));
                                        setConfig("radio_volume",""+dt["value"]);
                                        sendMessage(JSON.stringify({ module: "radio", action: "volume", value: dt["value"] }));
                                    }
                                } else {
                                    log("ERROR","Communication Thread","Accepted incorrent command from client");
                                    ws.send("ERROR:[NEPLATNÁ AKCE]");
                                }
                            break;
                            case "loxone":
                                if(dt["action"] == "resend") {
                                    socket.send(dt["value"]);
                                } else {
                                    log("ERROR","Communication Thread","Accepted incorrent command from client");
                                    ws.send("ERROR:[NEPLATNÁ AKCE]");
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

    function setConfig(key, value) {
        sql_query("UPDATE configuration SET v='"+value+"' WHERE k='"+key+"';");
    }
    
    function log(level, module, text) {
        var date = new Date();
        console.log("["+date.getHours()+":"+date.getMinutes()+":"+date.getSeconds()+"] ["+level+"] ["+module+"] "+text);
        sql_query("INSERT INTO logs (level, module, text) VALUES ('"+level+"','"+module+"','"+text+"')");
    }
    
    function sql_query(sql) {
        return new Promise((resolve, reject) => {
            con.query(sql, (error, result) => {
                if(error) {
                    reject(error);
                } else {
                    resolve(result);
                }
            });
        });
    }
});

async function setVolume(volume) {
    await sendVlcRequest("http://localhost:8080/requests/status.xml?command=volume&val="+(512*volume));
}

async function play() {
    await sendVlcRequest("http://localhost:8080/requests/status.xml?command=pl_play");
}

async function pause() {
    await sendVlcRequest("http://localhost:8080/requests/status.xml?command=pl_pause");
}

async function stop() {
    await sendVlcRequest("http://localhost:8080/requests/status.xml?command=pl_stop");
}

async function playAudioStream(streamUrl) {
    await sendVlcRequest("http://localhost:8080/requests/status.xml?command=in_enqueue&input="+encodeURIComponent(streamUrl));
}

async function clearpl() {
    await sendVlcRequest("http://localhost:8080/requests/status.xml?command=pl_empty");
}

async function getLastPlayList() {
    await sendVlcRequest("http://localhost:8080/requests/playlist.xml").then(function(res) {
        var d = JSON.parse(xmljs.xml2json(res.data, {compact: true,space: 4}))["node"]["node"][0]["leaf"];
        console.log(d[d.length-1]["_attributes"]["id"]);
    });
}

async function sendVlcRequest(url) {
    return await axios.get(url, { auth: { username: '', password: '1234' }});
}