import { WebSocketServer, WebSocket } from 'ws';
import gTTS from 'gtts';
import * as mysql from 'mysql';
import axios from 'axios';
import xmljs from 'xml-js';

var con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "assistant"
});

var clients = new Set();

con.connect(function(err) {
    if(err) throw err;

    log("INFO","Main Thread","Connection with database (MySQL) is established");
    log("INFO","Main Thread","Trying to create WebSocket listener on port 34987");

    var wss = new WebSocketServer({ port: 34987 });
    log("INFO","Main Thread","WebSocket listener is listening on port 34987");

    wss.on('connection', function(ws) {

        clients.add(ws);
        log("INFO","Connection Thread","Client has connected");
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