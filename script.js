var time = document.getElementById("time");
var date = document.getElementById("date");
var socket;
var aliases = {};
var dt;

updateDateAndTime();
setInterval(function() {
    updateDateAndTime();
}, 1000);

//##########################################
// Radio
//##########################################

var radio = null;
var radioList = null;
var radioCurrentId = 0;
var radioVolume = 0.5;

$.get("assets/radio/radios.json", function(item) {
    radioList = item;
});

document.getElementById("radioPrev").addEventListener("click",function() {
    if(radioCurrentId == 0) {
        radioCurrentId = Object.keys(radioList).length-1;
    } else {
        radioCurrentId--;
    }
    document.getElementById("radio-image").src = radioList[radioCurrentId][1];
    document.getElementById("radio-title").innerHTML = radioList[radioCurrentId][0];
    if(radio != null && !radio.paused) {
        radio.pause();
        radio = null;
        radio = new Audio(radioList[radioCurrentId][2]);
        radio.volume = radioVolume;
        radio.play();
    }
});

document.getElementById("radioPlay").addEventListener("click",function() {
    if(radio == null || radio.paused) {
        radio = new Audio(radioList[radioCurrentId][2]);
        radio.volume = radioVolume;
        radio.play();
        document.getElementById("radio-image").style.animation = "8s rotate360 infinite linear";
    } else {
        radio.pause();
        document.getElementById("radio-image").style.animation = "";
    }
});

document.getElementById("radioNext").addEventListener("click",function() {
    if(radioCurrentId == Object.keys(radioList).length-1) {
        radioCurrentId = 0;
    } else {
        radioCurrentId++;
    }
    document.getElementById("radio-image").src = radioList[radioCurrentId][1];
    document.getElementById("radio-title").innerHTML = radioList[radioCurrentId][0];
    if(radio != null && !radio.paused) {
        radio.pause();
        radio = null;
        radio = new Audio(radioList[radioCurrentId][2]);
        radio.volume = radioVolume;
        radio.play();
    }
});

//##########################################
// Weather
//##########################################

var opennedWeather = 0;
var weatherData = null;
var usedArray = [];

$.get("assets/weather/weather.json", function(data) {
    weatherData = data;
    var lastDt = "";
    var x = 0;
    var y = 0;
    var z = 0;
    weatherData.list.forEach(function(item) {
        var dt = item.dt_txt.split(" ")[0];
        if(lastDt != dt) {
            lastDt = dt;
            x = 0;
            if(usedArray.length < 5) {
                usedArray.push(y);
                z++;
                var dayNumber = new Date().getDay();
                var nmbr = dayNumber+z-1;
                if(dayNumber+z-1 > 7) {
                    nmbr = dayNumber+z-8;
                }
                document.getElementById("weather-dayname"+z).innerHTML = getDay(nmbr);
                document.getElementById("weather"+z+"img").src = getWeatherImage(weatherData.list[usedArray[z-1]].weather[0].description);
                document.getElementById("weather"+z+"temp").innerHTML = (Math.round(weatherData.list[usedArray[z-1]].main.temp)/10) + " °C";
            }
        } else x++;
        y++;
    });
    document.getElementById("table-sunrise").innerHTML = new Date(weatherData.city.sunrise*1000).toLocaleTimeString();
    document.getElementById("table-sunset").innerHTML = new Date(weatherData.city.sunset*1000).toLocaleTimeString();
});

function updateDateAndTime() {
    var datetime = new Date();
    time.innerHTML = getFormatTime(datetime.getHours()) + ":" + getFormatTime(datetime.getMinutes());
    date.innerHTML = getDay(datetime.getDay()) + "<br>" + datetime.getDate() + ". " + getMonth(datetime.getMonth()) + " " + datetime.getFullYear();
}

function showWeather(id) {
    if(opennedWeather==id) {
        for(var x=1;x!=6;x++) {
            document.getElementById("weather"+x).style.background = "rgba(255, 255, 255, 0.25)";
        }
        opennedWeather=0;
        document.getElementById("weather-window").style.display = "none";
        document.getElementById("panel-loxone").style.display = "flex";
    } else {
        for(var x=1;x!=6;x++) {
            if(x!=id) document.getElementById("weather"+x).style.background = "rgba(255, 255, 255, 0.25)";
        }
        switch(id) {
            case 1:
                document.getElementById("weather-window-title").innerHTML = "Počasí Dnes";
                var actualDateTime = new Date();
                document.getElementById("weather-subtitle").innerHTML = document.getElementById("weather-dayname"+id).innerHTML+" ("+actualDateTime.getDate()+". "+getMonth(actualDateTime.getMonth())+". "+actualDateTime.getFullYear()+") - Poslední aktualizace před hodinou";
            break;
            case 2:
                document.getElementById("weather-window-title").innerHTML = "Počasí Zítra";
                var actualDateTime = new Date();actualDateTime.setDate(actualDateTime.getDate() + 1);
                document.getElementById("weather-subtitle").innerHTML = document.getElementById("weather-dayname"+id).innerHTML+" ("+actualDateTime.getDate()+". "+getMonth(actualDateTime.getMonth())+". "+actualDateTime.getFullYear()+") - Poslední aktualizace před hodinou";
            break;
            case 3:
                document.getElementById("weather-window-title").innerHTML = "Počasí +1 Den";
                var actualDateTime = new Date();actualDateTime.setDate(actualDateTime.getDate() + 2);
                document.getElementById("weather-subtitle").innerHTML = document.getElementById("weather-dayname"+id).innerHTML+" ("+actualDateTime.getDate()+". "+getMonth(actualDateTime.getMonth())+". "+actualDateTime.getFullYear()+") - Poslední aktualizace před hodinou";
            break;
            case 4:
                document.getElementById("weather-window-title").innerHTML = "Počasí +2 Dny";
                var actualDateTime = new Date();actualDateTime.setDate(actualDateTime.getDate() + 3);
                document.getElementById("weather-subtitle").innerHTML = document.getElementById("weather-dayname"+id).innerHTML+" ("+actualDateTime.getDate()+". "+getMonth(actualDateTime.getMonth())+". "+actualDateTime.getFullYear()+") - Poslední aktualizace před hodinou";
            break;
            case 5:
                document.getElementById("weather-window-title").innerHTML = "Počasí +3 Dny";
                var actualDateTime = new Date();actualDateTime.setDate(actualDateTime.getDate() + 4);
                document.getElementById("weather-subtitle").innerHTML = document.getElementById("weather-dayname"+id).innerHTML+" ("+actualDateTime.getDate()+". "+getMonth(actualDateTime.getMonth())+". "+actualDateTime.getFullYear()+") - Poslední aktualizace před hodinou";
            break;
        }
        
        document.getElementById("weather-window-img").src = getWeatherImage(weatherData.list[usedArray[id-1]].weather[0].description);
        document.getElementById("table-temperature").innerHTML = (Math.round(weatherData.list[usedArray[id-1]].main.temp)/10) + " °C";
        document.getElementById("table-precip").innerHTML = weatherData.list[usedArray[id-1]].pop + " mm";
        document.getElementById("table-humidity").innerHTML = weatherData.list[usedArray[id-1]].main.humidity + " h";
        document.getElementById("table-cloud").innerHTML = weatherData.list[usedArray[id-1]].clouds.all;
        document.getElementById("table-pressure").innerHTML = weatherData.list[usedArray[id-1]].main.pressure + " Pa";
        document.getElementById("table-feeltemperature").innerHTML = (Math.round(weatherData.list[usedArray[id-1]].main.feels_like)/10) + " °C";
        document.getElementById("table-windmph").innerHTML = weatherData.list[usedArray[id-1]].wind.speed + " mph";
        document.getElementById("table-winddir").innerHTML = calculateWindDir(weatherData.list[usedArray[id-1]].wind.deg);

        opennedWeather=id;
        document.getElementById("weather"+id).style.background = "rgba(255, 255, 255, 0.45)";
        document.getElementById("weather-window").style.display = "block";
        document.getElementById("panel-loxone").style.display = "none";
    }
}

function calculateWindDir(angle) {
    if((angle > 337.5 && angle < 360) || (angle > 0 && angle <= 22.5)) {
        return "Sever";
    } else if(angle > 22.5 && angle <= 67.5) {
        return "Severo-Západ";
    } else if(angle > 67.5 && angle <= 112.5) {
        return "Západ";
    } else if(angle > 112.5 && angle <= 157.5) {
        return "Jiho-Západ";
    } else if(angle > 157.5 && angle <= 202.5) {
        return "Jih";
    } else if(angle > 202.5 && angle <= 247.5) {
        return "Jiho-Východ";
    } else if(angle > 247.5 && angle <= 292.5) {
        return "Východ";
    } else if(angle > 292.5 && angle <= 337.5) {
        return "Severo-Východ";
    }
}

function getWeatherImage(c) {
    var id = "";
    switch(c) {
        case "clear sky":
            id="day-1";
        break;
        case "few clouds":
            id="day-2";
        break;
        case "scattered clouds":
            id="day-3";
        break;
        case "broken clouds":
            id="cloudy";
        break;
        case "shower rain":
            id="rainy-3";
        break;
        case "rain":
            id="rainy-2";
        break;
        case "thunderstorm":
            id="thunder";
        break;
        case "snow":
            id="snowy-5";
        break;
        case "mist":
            id="cloudy";
        break;
        case "overcast clouds":
            id="cloudy";
        break;
    }
    return "assets/images/"+id+".svg";
}

//##########################################
// Utility
//##########################################

function getFormatTime(time) {
    if(time < 10) {
        return "0" + time;
    }
    return time;
}

function getDay(number) {
    var days = ["Neděle","Pondělí","Úterí","Středa","Čtvrtek","Pátek","Sobota"];
    return days[number];
}

function getMonth(number) {
    var months = ["Ledna","Února","Března","Dubna","Května","Června","Července","Srpna","Září","Října","Listopadu","Prosince"];
    return months[number];
}

//##########################################
// Loxone
//##########################################

function loxoneToggleView() {
    var lx = document.getElementById("panel-loxone");
    if(lx.style.width == "calc(80% - 20px)" || lx.style.width == "") {
        lx.style.width = "calc(100% - 40px)";
        lx.style.height = "calc(100% - 200px)";
        document.getElementById("panel-weather").style.display = "none";
        document.getElementById("panel-radio").style.display = "none";
        document.getElementById("fullscreen-svg").style.fill = "#69C350";
    } else {
        lx.style.width = "calc(80% - 20px)";
        lx.style.height = "calc(100% - 560px)";
        document.getElementById("panel-weather").style.display = "flex";
        document.getElementById("panel-radio").style.display = "block";
        document.getElementById("fullscreen-svg").style.fill = "#ffffff";
    }
}

$.ajax({
    url: "http://192.168.5.205:8080/data/LoxAPP3.json",
    type: "GET",
    username: "Daniel",
    password: "Minecraft96",
    processData: false,
    contentType: "application/json",
    success: function (data) {
        dt = data;
        var delegateObj = {
            socketOnDataProgress: function socketOnDataProgress(socket, progress) {
                console.log(progress);
            },
            socketOnEventReceived: function socketOnEventReceived(socket, events, type) {
                if (type === 2) {
                    events.forEach(function(event) {
                        var euuid = event.uuid;
                        var value = event.value;
                        var a = document.getElementById(euuid);
                        var b = document.getElementById(aliases[euuid]);
                        if(a) {
                            dec(euuid);
                        } else if(b) {
                            dec(aliases[euuid]);
                        }

                        function dec(uuid) {
                            switch(dt.controls[uuid].type) {
                                case "InfoOnlyAnalog":
                                    var index = dt.controls[uuid].details.format;
                                    var roundTo = index.substring(index.indexOf("%.") + 2, index.lastIndexOf("f"));
                                    a.innerHTML = index.replace("%."+roundTo+"f",value.toFixed(roundTo)).replace("%%","%");
                                break;
                                case "InfoOnlyDigital":
                                    if(value == 1) {
                                        a.innerHTML = "<txt style='color:" + dt.controls[uuid].details.color.on + ";'>" + dt.controls[uuid].details.text.on + "</txt>";
                                        document.getElementById(uuid+"-icon").childNodes[0].style.fill = dt.cats[dt.controls[uuid].cat].color;
                                    } else {
                                        a.innerHTML = "<txt style='color:" + dt.controls[uuid].details.color.off + ";'>" + dt.controls[uuid].details.text.off + "</txt>";
                                        document.getElementById(uuid+"-icon").childNodes[0].style.fill = "white";
                                    }
                                break;
                                case "Switch":
                                    if(value == 1) {
                                        a.checked = true;
                                        document.getElementById(uuid+"-icon").childNodes[0].style.fill = dt.cats[dt.controls[uuid].cat].color;
                                    } else {
                                        a.checked = false;
                                        document.getElementById(uuid+"-icon").childNodes[0].style.fill = "white";
                                    }
                                break;
                                case "EIBDimmer":
                                    document.getElementById(uuid).value = Math.round(value);
                                break;
                                default:
                                    console.log(uuid + " - " + dt.controls[uuid].type);
                                    a.innerHTML = value;
                                break;
                            }
                        }
                    });
                }
            }
        };

        var WebSocketConfig = LxCommunicator.WebSocketConfig;
        var config = new WebSocketConfig("a466678a-200a-4c8b-beb4-cce31a9b56a4", delegateObj);
        socket = new LxCommunicator.WebSocket(config);
        var container = document.getElementById("panel-loxone");

        Object.keys(dt.controls).forEach(function(key) {
            var icon = dt.cats[dt.controls[key].cat].image;
            var color = "white";
            if(dt.controls[key].defaultIcon) {
                icon = dt.controls[key].defaultIcon;
                color = "white";
            }
            if(dt.controls[key].states.position) {
                aliases[dt.controls[key].states.position] = key;
            }
            switch(dt.controls[key].type) {
                case "InfoOnlyAnalog":
                    container.innerHTML += '<div class="block block-item '+dt.controls[key].type.toLowerCase()+' panel"><div id="'+key+'-icon">'+getSvg(icon, color, key)+'</div><txt class="title">'+dt.controls[key].name+'</txt><br><txt class="value" id="'+key+'">N/A</txt></div>';
                break;
                case "InfoOnlyDigital":
                    container.innerHTML += '<div class="block block-item '+dt.controls[key].type.toLowerCase()+' panel"><div id="'+key+'-icon">'+getSvg(icon, color, key)+'</div><txt class="title">'+dt.controls[key].name+'</txt><br><txt class="value" id="'+key+'">N/A</txt></div>';
                break;
                case "Switch":
                    container.innerHTML += '<div class="block block-item '+dt.controls[key].type.toLowerCase()+' panel"><div id="'+key+'-icon">'+getSvg(icon, color, key)+'</div><txt class="title">'+dt.controls[key].name+'</txt><br><label class="switch"><input type="checkbox" onclick="switchIt(this)" id="'+key+'"><span class="slider"></span></label></txt></div>';
                break;
                case "EIBDimmer":
                    container.innerHTML += '<div class="block block-item '+dt.controls[key].type.toLowerCase()+' panel"><div id="'+key+'-icon">'+getSvg(icon, color, key)+'</div><txt class="title">'+dt.controls[key].name+'</txt><br><input type="range" onchange="dimmer(this)" min="0" max="100" id="'+key+'"></txt></div>';
                break;
            }
        });
        Object.keys(dt.rooms).forEach(function(key) {
            container.innerHTML += '<div class="block block-room"><div id="'+key+'-icon">'+getSvg(dt.rooms[key].image, dt.rooms[key].color, key)+'</div><txt class="title">'+dt.rooms[key].name+'</txt></div>';
        });

        Object.keys(dt.cats).forEach(function(key) {
            container.innerHTML += '<div class="block block-cats"><div id="'+key+'-icon">'+getSvg(dt.cats[key].image, dt.cats[key].color, key)+'</div><txt class="title">'+dt.cats[key].name+'</txt></div>';
        });

        socket.open("192.168.5.205:8080", "Daniel", "Minecraft96").then(function() {
            socket.send("jdev/sps/enablebinstatusupdate");
        });

        async function getSvg(imageUrl, color, key) {
            await $.get("assets/images/"+imageUrl, function(data) {
                document.getElementById(key+"-icon").innerHTML = XMLToString(data).replace("<svg ","<svg style='fill:"+color+";' ");
                return "";
            });
        }
        
        function XMLToString(oXML) {
            if(window.ActiveXObject) {
                return oXML.xml;
            } else {
                return (new XMLSerializer()).serializeToString(oXML);
            }
        }
    }
});

updatePage(1);
function updatePage(id) {
    var temp = document.getElementsByClassName("block-item");
    for(var i=0;i<temp.length;i++) {
        temp.item(i).style.display = "none";
    }
    temp = document.getElementsByClassName("block-room");
    for(var i=0;i<temp.length;i++) {
        temp.item(i).style.display = "none";
    }
    temp = document.getElementsByClassName("block-cats");
    for(var i=0;i<temp.length;i++) {
        temp.item(i).style.display = "none";
    }
    switch(id) {
        case 1:
            temp = document.getElementsByClassName("block-item");
            for(var i=0;i<temp.length;i++) {
                temp.item(i).style.display = "block";
            }
            document.getElementById("selPage1-svg").style.fill="#69C350";
            document.getElementById("selPage2-svg").style.fill="#ffffff";
            document.getElementById("selPage3-svg").style.fill="#ffffff";
        break;
        case 2:
            temp = document.getElementsByClassName("block-room");
            for(var i=0;i<temp.length;i++) {
                temp.item(i).style.display = "block";
            }
            document.getElementById("selPage1-svg").style.fill="#ffffff";
            document.getElementById("selPage2-svg").style.fill="#69C350";
            document.getElementById("selPage3-svg").style.fill="#ffffff";
        break;
        case 3:
            temp = document.getElementsByClassName("block-cats");
            for(var i=0;i<temp.length;i++) {
                temp.item(i).style.display = "block";
            }
            document.getElementById("selPage1-svg").style.fill="#ffffff";
            document.getElementById("selPage2-svg").style.fill="#ffffff";
            document.getElementById("selPage3-svg").style.fill="#69C350";
        break;
    }
}
        
function switchIt(e) {
    var state = "off";
    if(e.checked) state = "on";
    socket.send("jdev/sps/io/"+e.id+"/"+state);
}

function dimmer(e) {
    socket.send("jdev/sps/io/"+dt.controls[e.id].uuidAction+"/"+e.value);
}