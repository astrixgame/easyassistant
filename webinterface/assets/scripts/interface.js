var connection = new WebSocket("ws://"+window.location.host+":"+window.location.port+"/ws");
var dateDay = document.getElementById("date-day");
var dateDate = document.getElementById("date-date");
var dateTime = document.getElementById("date-clock");
var all = document.getElementById("all");
var rated = document.getElementById("rated");
var openned = document.getElementById("open");
var menuItems = document.querySelectorAll(".menu-item");
var overlay = document.getElementById("overlay");
//var speechRecognition_start = document.getElementById("speechRecognition");
//var speechRecognition_buble = document.getElementById("speechBuble");
//var speechRecognition_thread = null;
var days = ["Neděle","Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota"];
var months = ["Ledna","Února","Března","Dubna","Května","Června","Července","Srpna","Zíří","Října","Listopadu","Prosince"];
var connectionIntervalRetry = null;
var audio_notification = new Audio('assets/media/notification.mp3');
var charts = {};
var colors = {};

connection.onerror = function() {
    ws.close();
}

connection.onclose = function() {
    /*connectionIntervalRetry = setInterval(function() {
        var retry_connection = new WebSocket("ws://192.168.5.99:34987");
        retry_connection.onopen = function() {
            retry_connection.close();
            window.location.href=window.location.href;
        };
    }, 10000);*/
};

function lxControl(uuid, type, value) {
    if(typeof value == "boolean")
        value = value ? 1 : 0;
    connection.send(JSON.stringify({ module: "control", action: "change", uuid: uuid, type: type, value: value }));
}

connection.onopen = function() {
    updateDate();
    setInterval(function() {
        updateDate();
    }, 1000);

    all.innerHTML += '<div class="item-title" id="alltitle"><p>Vše</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg></div>';

    connection.onmessage = function(event) {
        var data = JSON.parse(event.data);
        switch(data["module"]) {
            case "weather":
                
            break;
            case "control":
                switch(data["action"]) {
                    case "add":
                        switch(data["menu"]) {
                            case "control":
                                var control = "";
                                var fullControl = "";
                                var valueLine = true;
                                switch(data["type"]) {
                                    case "InfoOnlyDigital":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <div class="row">
                                                            <p class="name">Stav</p><p class="subvalue" data-id="`+data["uuid"]+`-value">N/A</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "InfoOnlyAnalog":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <div class="row">
                                                            <p class="name">Stav</p><p class="subvalue" data-id="`+data["uuid"]+`-value">N/A</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "Switch":
                                        control = `
                                            <div class="control">
                                                <label class="switch">
                                                    <input type="checkbox" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', this.checked)" data-id="`+data["uuid"]+`-value">
                                                    <span class="slider"></span>
                                                </label>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <label class="switch">
                                                            <input type="checkbox" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', this.checked)" data-id="`+data["uuid"]+`-value">
                                                            <span class="slider"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                        valueLine = false;
                                    break;
                                    case "TextState":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <div class="row">
                                                            <p class="name">Stav</p><p class="subvalue" data-id="`+data["uuid"]+`-value">N/A</p>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "Meter":
                                        switch(data["subtype"]) {
                                            case "storage":
                                                control = `
                                                    <p class="value" data-id="`+data["uuid"]+`-value">
                                                        <txt data-id="`+data["uuid"]+`-value1">N/A</txt> • 
                                                        <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                                    </p>
                                                `;
                                                fullControl = `
                                                    <div class="item" id="`+data["uuid"]+`-open">
                                                        <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                            </svg>
                                                        </button>
                                                        <p class="title">`+data["title"]+`</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                        <div class="controling">
                                                            <div class="hideselect">
                                                                <div class="row">
                                                                    <p class="name">Nabití</p><p class="subvalue" data-id="`+data["uuid"]+`-value1">N/A</p>
                                                                </div>
                                                                <div class="row">
                                                                    <p class="name">Stav</p><p class="subvalue" data-id="`+data["uuid"]+`-value2">N/A</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `;
                                            break;
                                            case "unidirectional":
                                                control = `
                                                    <p class="value" data-id="`+data["uuid"]+`-value">
                                                        <txt data-id="`+data["uuid"]+`-value1">N/A</txt> • 
                                                        <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                                    </p>
                                                `;
                                                fullControl = `
                                                    <div class="item" id="`+data["uuid"]+`-open">
                                                        <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                            </svg>
                                                        </button>
                                                        <p class="title">`+data["title"]+`</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                        <div class="controling">
                                                            <div class="hideselect">
                                                                <div class="row">
                                                                    <p class="name">Aktuálně</p><p class="subvalue" data-id="`+data["uuid"]+`-value1">N/A</p>
                                                                </div>
                                                                <div class="row">
                                                                    <p class="name">Celkem</p><p class="subvalue" data-id="`+data["uuid"]+`-value2">N/A</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `;
                                            break;
                                            case "bidirectional":
                                                control = `
                                                    <p class="value" data-id="`+data["uuid"]+`-value">
                                                        <txt data-id="`+data["uuid"]+`-value1">N/A</txt> • 
                                                        <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                                    </p>
                                                `;
                                                fullControl = `
                                                    <div class="item" id="`+data["uuid"]+`-open">
                                                        <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                            </svg>
                                                        </button>
                                                        <p class="title">`+data["title"]+`</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                        <div class="controling">
                                                            <div class="hideselect">
                                                                <div class="row">
                                                                    <p class="name">Aktuálně</p><p class="subvalue" data-id="`+data["uuid"]+`-value1">N/A</p>
                                                                </div>
                                                                <div class="row">
                                                                    <p class="name">Celkem</p><p class="subvalue" data-id="`+data["uuid"]+`-value2">N/A</p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                `;
                                            break;
                                        }
                                    break;
                                    case "EIBDimmer":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <label class="switch">
                                                    <input type="checkbox" data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', this.checked)">
                                                    <span class="slider"></span>
                                                </label>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <label class="switch">
                                                            <input type="checkbox" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', this.checked)" data-id="`+data["uuid"]+`-value1">
                                                            <span class="slider"></span>
                                                        </label>
                                                        <input type="range" class="dimmer" id="`+data["uuid"]+`-temp" data-id="`+data["uuid"]+`-value2" min="0" max="100" value="0" oninput="slider(this.id);lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', this.value+\'%\')">
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "IRoomControllerV2":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M160 64c-26.5 0-48 21.5-48 48V276.5c0 17.3-7.1 31.9-15.3 42.5C86.2 332.6 80 349.5 80 368c0 44.2 35.8 80 80 80s80-35.8 80-80c0-18.5-6.2-35.4-16.7-48.9c-8.2-10.6-15.3-25.2-15.3-42.5V112c0-26.5-21.5-48-48-48zM48 112C48 50.2 98.1 0 160 0s112 50.1 112 112V276.5c0 .1 .1 .3 .2 .6c.2 .6 .8 1.6 1.7 2.8c18.9 24.4 30.1 55 30.1 88.1c0 79.5-64.5 144-144 144S16 447.5 16 368c0-33.2 11.2-63.8 30.1-88.1c.9-1.2 1.5-2.2 1.7-2.8c.1-.3 .2-.5 .2-.6V112zM208 368c0 26.5-21.5 48-48 48s-48-21.5-48-48c0-20.9 13.4-38.7 32-45.3V208c0-8.8 7.2-16 16-16s16 7.2 16 16V322.7c18.6 6.6 32 24.4 32 45.3z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "PresenceDetector":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <div class="row">
                                                            <p class="name">Aktivní od</p><p class="subvalue" data-id="`+data["uuid"]+`-value1">N/A</p>
                                                        </div>
                                                        <div class="row row-link">
                                                            <p class="name">Historie</p>
                                                            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "TimedSwitch":
                                        control = `
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'push\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                                        <path d="M176 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h16V98.4C92.3 113.8 16 200 16 304c0 114.9 93.1 208 208 208s208-93.1 208-208c0-41.8-12.3-80.7-33.5-113.2l24.1-24.1c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L355.7 143c-28.1-23-62.2-38.8-99.7-44.6V64h16c17.7 0 32-14.3 32-32s-14.3-32-32-32H224 176zm72 192V320c0 13.3-10.7 24-24 24s-24-10.7-24-24V192c0-13.3 10.7-24 24-24s24 10.7 24 24z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                        valueLine = false;
                                    break;
                                    case "LeftRightAnalog":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'right\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/>
                                                    </svg>
                                                </button>
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'left\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "Pushbutton":
                                        control = `
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'push\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                        valueLine = false;
                                    break;
                                    case "Irrigation":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'startForce\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                                                    </svg>
                                                </button>
                                                <button data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'stop\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <button class="b1" data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'startForce\')">Spustit závlahu</button>
                                                        <button class="b1" data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'stop\')">Zastavit závlahu</button>
                                                    </div>
                                                    <div class="row row-link">
                                                        <p class="name">Aktivita</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                                                    </div>
                                                    <div class="row row-link">
                                                        <p class="name">Doba závlahy</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "SmokeAlarm":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <button class="b1" data-id="`+data["uuid"]+`-value1" onclick="">Spustit servisní režim</button>
                                                        <button class="b1" data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'confirm\')">Potvrďit alarm</button>
                                                        <button class="b1" data-id="`+data["uuid"]+`-value3" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'mute\')">Vypnout výstupy alarmu</button>
                                                    </div>
                                                    <div class="row row-link">
                                                        <p class="name">Historie</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "EnergyManager2":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value"></p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <div class="controling">
                                                    <div class="meterchart">
                                                        <div class="row">
                                                            <p class="name">Vlastní spotřeba</p>
                                                            <p class="value" data-id="`+data["uuid"]+`-value1">N/A</p>
                                                        </div>
                                                        <div class="row">
                                                            <p class="name">Dostupný výkon</p>
                                                            <p class="value" data-id="`+data["uuid"]+`-value2">N/A</p>
                                                        </div>
                                                        <div class="pie-chart" id="`+data["uuid"]+`-chart"></div>
                                                    </div>
                                                    <div class="order-rows" data-id="`+data["uuid"]+`-value9">
                                                        <div class="row-title">
                                                            <p class="name">Zátěže</p>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Výkon</p>
                                                        <p class="subvalue" data-id="`+data["uuid"]+`-value3">N/A</p>
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Stav nabití</p>
                                                        <p class="subvalue" data-id="`+data["uuid"]+`-value4">N/A</p>
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Min % dobití</p>
                                                        <p class="subvalue" data-id="`+data["uuid"]+`-value5">N/A</p>
                                                        <input type="range" id="`+data["uuid"]+`-temp1" data-id="`+data["uuid"]+`-value6" value="0" oninput="slider(this.id);lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'minstorage:\'+this.value)" min="0" max="100" step="1" style="background: linear-gradient(to right, rgb(235, 235, 245) 54.386%, rgba(255, 255, 255, 0.1) 54.386%);">
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Max dobití výkon</p>
                                                        <p class="subvalue" data-id="`+data["uuid"]+`-value7">N/A</p>
                                                        <input type="range" id="`+data["uuid"]+`-temp2" data-id="`+data["uuid"]+`-value8" value="0" oninput="slider(this.id);lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'maxstorage:\'+this.value)" min="0" max="10" step="1" style="background: linear-gradient(to right, rgb(235, 235, 245) 54.386%, rgba(255, 255, 255, 0.1) 54.386%);">
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "EFM":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">
                                                <txt data-id="`+data["uuid"]+`-value1">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                            </p>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "Wallbox2":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">
                                                <txt data-id="`+data["uuid"]+`-value1">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                            </p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">
                                                    <txt data-id="`+data["uuid"]+`-value1">N/A</txt>
                                                    <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                                </p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <button class="b1" data-id="`+data["uuid"]+`-value3" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'pause\')">Pozastavit nabíjení</button>
                                                        <button class="b1" data-id="`+data["uuid"]+`-value4" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'start\')">Spustit nabíjení</button>
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Výkon</p>
                                                        <p class="subvalue" data-id="`+data["uuid"]+`-value5">N/A</p>
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Nabitá energie</p>
                                                        <p class="subvalue" data-id="`+data["uuid"]+`-value6">N/A</p>
                                                    </div>
                                                    <div class="spacer">Režim</div>
                                                    <div class="row">
                                                        <p class="name">Režim nabíjení</p>
                                                        <select data-id="`+data["uuid"]+`-value7" onchange="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'mode:\'+this.value)"></select>
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Max. výkon</p>
                                                        <p class="subvalue" data-id="`+data["uuid"]+`-value8">N/A</p>
                                                        <input type="range" id="`+data["uuid"]+`-temp" data-id="`+data["uuid"]+`-value9" value="0" oninput="slider(this.id);lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'limit:\'+this.value)" min="`+data["min"]+`" max="`+data["max"]+`" step="0.01">
                                                    </div>
                                                    <div class="spacer">Statistiky</div>
                                                    <div class="row row-link">
                                                        <p class="name">Výkon</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                                                    </div>
                                                    <div class="row row-link">
                                                        <p class="name">Spotřeba</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "LoadManager":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "AalSmartAlarm":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `
                                            
                                        `;
                                    break;
                                    case "Alarm":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <button class="b1" data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'on\')">Zastřežit</button>
                                                        <button class="b1" data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'delayon\')">Zastřežit se spožděním</button>
                                                        <button class="b1" data-id="`+data["uuid"]+`-value3" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'off\')">Odstřežit</button>
                                                        <button class="b1" data-id="`+data["uuid"]+`-value4" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'confirm\')">Potvrďit</button>
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Pohybové sensory</p>
                                                        <label class="switch">
                                                            <input type="checkbox" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', this.checked ? \'dismv:0\' : \'dismv:1\')" data-id="`+data["uuid"]+`-value5">
                                                            <span class="slider"></span>
                                                        </label>
                                                    </div>
                                                    <div class="row row-link">
                                                        <p class="name">Historie</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"/></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "AalEmergency":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "PulseAt":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'push\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "WindowMonitor":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">
                                                <txt data-id="`+data["uuid"]+`-value1">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value3">N/A</txt>
                                            </p>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value"></p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                        `;
                                        data["windows"].forEach(function(item) {
                                            fullControl += `
                                                <div class="row">
                                                    <p class="name ws">`+item.window+`</p>
                                                    <p class="subname">`+item.room+`</p>
                                                    <p class="subvalue" data-id="`+data["uuid"]+`-value`+(item.id+4)+`">N/A</p>
                                                </div>
                                            `;
                                        });
                                        fullControl += `
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "CentralLightController":
                                        valueLine = false;
                                    break;
                                    case "CentralJalousie":
                                        control = `
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'up\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/></svg></button><button data-id="'+data["uuid"]+'-value2" onclick="lxControl(\''+data["uuid"]+'\', \''+data["type"]+'\', \'down\')"><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                        valueLine = false;
                                    break;
                                    case "ClimateController":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "CentralAudioZone":
                                        fullControl = `

                                        `;
                                        valueLine = false;
                                    break;
                                    case "LightControllerV2":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'next\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 384 512">
                                                        <path d="M272 384c9.6-31.9 29.5-59.1 49.2-86.2l0 0c5.2-7.1 10.4-14.2 15.4-21.4c19.8-28.5 31.4-63 31.4-100.3C368 78.8 289.2 0 192 0S16 78.8 16 176c0 37.3 11.6 71.9 31.4 100.3c5 7.2 10.2 14.3 15.4 21.4l0 0c19.8 27.1 39.7 54.4 49.2 86.2H272zM192 512c44.2 0 80-35.8 80-80V416H112v16c0 44.2 35.8 80 80 80zM112 176c0 8.8-7.2 16-16 16s-16-7.2-16-16c0-61.9 50.1-112 112-112c8.8 0 16 7.2 16 16s-7.2 16-16 16c-44.2 0-80 35.8-80 80z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling" id="`+data["uuid"]+`-controling1">
                                                    <div class="moods" data-id="`+data["uuid"]+`-value2">
                                                        
                                                    </div>
                                                    <div class="spacer"></div>
                                                    <div class="row row-link" onclick="">
                                                        <p class="name">Více</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"></path></svg>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "ColorPickerV2":
                                        valueLine = false;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling" id="`+data["uuid"]+`-controling1">
                                                    <div class="moods" data-id="`+data["uuid"]+`-value2">
                                                        
                                                    </div>
                                                    <div class="spacer"></div>
                                                    <div class="row row-link" onclick="document.getElementById('`+data["uuid"]+`-controling1').style.display='none';document.getElementById('`+data["uuid"]+`-controling2').style.display='block';">
                                                        <p class="name">Více</p>
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512"><path d="M310.6 233.4c12.5 12.5 12.5 32.8 0 45.3l-192 192c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3L242.7 256 73.4 86.6c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0l192 192z"></path></svg>
                                                    </div>
                                                </div>
                                                <div class="controling" id="`+data["uuid"]+`-controling2" style="display:none;">
                                                    <button class="b1" onclick="document.getElementById('`+data["uuid"]+`-controling1').style.display='block';document.getElementById('`+data["uuid"]+`-controling2').style.display='none';">Nálady</button>
                                                    <div class="custom-color" data-id="`+data["uuid"]+`-value3">
                                                        <div class="color-selector" id="colorselect1`+data["uuid"]+`">
                                                            <div class="color-sel" id="colorselect1-`+data["uuid"]+`"></div>
                                                            <img src="assets/images/colors/temp.png" class="previewSelector" onclick="document.getElementById('colorselect1`+data["uuid"]+`').style.display='none';document.getElementById('colorselect2`+data["uuid"]+`').style.display='block';">
                                                        </div>
                                                        <div class="color-selector" style="display:none;" id="colorselect2`+data["uuid"]+`">
                                                            <div class="color-sel" id="colorselect2-`+data["uuid"]+`"></div>
                                                            <img src="assets/images/colors/rgb.png" class="previewSelector" onclick="document.getElementById('colorselect1`+data["uuid"]+`').style.display='block';document.getElementById('colorselect2`+data["uuid"]+`').style.display='none';">
                                                        </div>
                                                    </div>
                                                    <button class="b1" onclick="">Uložit jako náladu</button>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "AlarmClock":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dismiss\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M256 48a208 208 0 1 1 0 416 208 208 0 1 1 0-416zm0 464A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM175 175c-9.4 9.4-9.4 24.6 0 33.9l47 47-47 47c-9.4 9.4-9.4 24.6 0 33.9s24.6 9.4 33.9 0l47-47 47 47c9.4 9.4 24.6 9.4 33.9 0s9.4-24.6 0-33.9l-47-47 47-47c9.4-9.4 9.4-24.6 0-33.9s-24.6-9.4-33.9 0l-47 47-47-47c-9.4-9.4-24.6-9.4-33.9 0z"/>
                                                    </svg>
                                                </button>
                                                <button data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'snooze\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                                        <path d="M32 32c17.7 0 32 14.3 32 32V320H288V160c0-17.7 14.3-32 32-32H544c53 0 96 43 96 96V448c0 17.7-14.3 32-32 32s-32-14.3-32-32V416H352 320 64v32c0 17.7-14.3 32-32 32s-32-14.3-32-32V64C0 46.3 14.3 32 32 32zm144 96a80 80 0 1 1 0 160 80 80 0 1 1 0-160z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "Window":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/>
                                                    </svg>
                                                </button>
                                                <button data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'close\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <button class="b2" data-id="`+data["uuid"]+`-value1" onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'openstart\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'openstop\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'openstart\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'openstop\')">Otevřít</button>
                                                        <button class="b2" data-id="`+data["uuid"]+`-value2" onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'closestart\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'closestop\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'closestart\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'closestop\')">Zavřít</button>
                                                        <button class="b2" data-id="`+data["uuid"]+`-value3" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'open\')">Úplně otevřit</button>
                                                        <button class="b2" data-id="`+data["uuid"]+`-value4" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'close\')">Úplně zavřít</button>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "Jalousie":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'up\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/>
                                                    </svg>
                                                </button>
                                                <button data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'down\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <button class="b2" data-id="`+data["uuid"]+`-value1" onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'upstart\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'upstop\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'upstart\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'upstop\')">Nahoru</button>
                                                        <button class="b2" data-id="`+data["uuid"]+`-value2" onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'downstart\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'downstop\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'downstart\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'downstop\')">Dolů</button>
                                                        <button class="b2" data-id="`+data["uuid"]+`-value3" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'up\')">Úplně nahoru</button>
                                                        <button class="b2" data-id="`+data["uuid"]+`-value4" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'down\')">Úplně dolů</button>
                                                        <button class="b1" data-id="`+data["uuid"]+`-value5" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'shade\')">Stínění</button>
                                                    </div>
                                                    <div class="row">
                                                        <p class="name">Automatika dle polohy slunce</p>
                                                        <label class="switch">
                                                            <input type="checkbox" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', this.checked ? \'autoon\' : \'autooff\')" data-id="`+data["uuid"]+`-value6">
                                                            <span class="slider"></span>
                                                        </label>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "Gate":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'up\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"/>
                                                    </svg>
                                                </button>
                                                <button data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'down\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                                        <button class="b2" data-id="`+data["uuid"]+`-value3" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'up\')">Otevřít</button>
                                                        <button class="b2" data-id="`+data["uuid"]+`-value4" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'down\')">Zavřít</button>
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "Ventilation":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "Radio":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'plus\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                                        <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32V224H48c-17.7 0-32 14.3-32 32s14.3 32 32 32H192V432c0 17.7 14.3 32 32 32s32-14.3 32-32V288H400c17.7 0 32-14.3 32-32s-14.3-32-32-32H256V80z"/>
                                                    </svg>
                                                </button>
                                                <button data-id="`+data["uuid"]+`-value2" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'minus\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                                        <path d="M432 256c0 17.7-14.3 32-32 32L48 288c-17.7 0-32-14.3-32-32s14.3-32 32-32l352 0c17.7 0 32 14.3 32 32z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M352 256c0 22.2-1.2 43.6-3.3 64H163.3c-2.2-20.4-3.3-41.8-3.3-64s1.2-43.6 3.3-64H348.7c2.2 20.4 3.3 41.8 3.3 64zm28.8-64H503.9c5.3 20.5 8.1 41.9 8.1 64s-2.8 43.5-8.1 64H380.8c2.1-20.6 3.2-42 3.2-64s-1.1-43.4-3.2-64zm112.6-32H376.7c-10-63.9-29.8-117.4-55.3-151.6c78.3 20.7 142 77.5 171.9 151.6zm-149.1 0H167.7c6.1-36.4 15.5-68.6 27-94.7c10.5-23.6 22.2-40.7 33.5-51.5C239.4 3.2 248.7 0 256 0s16.6 3.2 27.8 13.8c11.3 10.8 23 27.9 33.5 51.5c11.6 26 20.9 58.2 27 94.7zm-209 0H18.6C48.6 85.9 112.2 29.1 190.6 8.4C165.1 42.6 145.3 96.1 135.3 160zM8.1 192H131.2c-2.1 20.6-3.2 42-3.2 64s1.1 43.4 3.2 64H8.1C2.8 299.5 0 278.1 0 256s2.8-43.5 8.1-64zM194.7 446.6c-11.6-26-20.9-58.2-27-94.6H344.3c-6.1 36.4-15.5 68.6-27 94.6c-10.5 23.6-22.2 40.7-33.5 51.5C272.6 508.8 263.3 512 256 512s-16.6-3.2-27.8-13.8c-11.3-10.8-23-27.9-33.5-51.5zM135.3 352c10 63.9 29.8 117.4 55.3 151.6C112.2 482.9 48.6 426.1 18.6 352H135.3zm358.1 0c-30 74.1-93.6 130.9-171.9 151.6c25.5-34.2 45.2-87.7 55.3-151.6H493.4z"/></svg>
                                                <div class="controling">
                                                    <div class="hideselect">
                                        `;
                                        data["modes"].forEach(function(item) {
                                            fullControl += `<button class="b1" data-id="`+data["uuid"]+`-value`+(item.id+3)+`" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'`+item.id+`\')">`+item.title+`</button>`;
                                        });
                                        fullControl += `
                                                    </div>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "AudioZoneV2":
                                        fullControl = `

                                        `;
                                        valueLine = false;
                                    break;
                                    case "Remote":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volminus\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volminusoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volminus\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volminusoff\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                                        <path d="M533.6 32.5C598.5 85.3 640 165.8 640 256s-41.5 170.8-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/>
                                                    </svg>
                                                </button>
                                                <button onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volplus\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volplusoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volplus\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volplusoff\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M320 64c0-12.6-7.4-24-18.9-29.2s-25-3.1-34.4 5.3L131.8 160H64c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h67.8L266.7 471.9c9.4 8.4 22.9 10.4 34.4 5.3S320 460.6 320 448V64z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `
                                            <div class="item" id="`+data["uuid"]+`-open">
                                                <button class="back" onclick="closePanel(\'`+data["uuid"]+`-open\')">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l192 192c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L77.3 256 246.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-192 192z"/>
                                                    </svg>
                                                </button>
                                                <p class="title">`+data["title"]+`</p>
                                                <div class="controling">
                                                    <div class="hideselect">
                                        `;
                                        data["modes"].forEach(function(item) {
                                            fullControl += `<button class="b1" data-id="`+data["uuid"]+`-value`+item.id+`" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'`+item.command+`\')">`+item.name+`</button>`;
                                        });
                                        fullControl += `
                                                    </div>
                                                </div>
                                                <div class="tv-controller">
                                                    <button style="background-color:#69c350;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'on\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M14.9941,7h.0118A1.61151,1.61151,0,0,1,16.5,8.70754V21.29246A1.61151,1.61151,0,0,1,15.0059,23h-.0118A1.61151,1.61151,0,0,1,13.5,21.29246V8.70754A1.61151,1.61151,0,0,1,14.9941,7Z" fill-rule="evenodd"></path>
                                                        </svg>
                                                    </button>
                                                    <button style="background-color:#e73246;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'reset\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M15,9.5A5.5,5.5,0,1,1,9.49146,15,5.51048,5.51048,0,0,1,15,9.5M15,7a8,8,0,1,0,8.00854,8A8.00427,8.00427,0,0,0,15,7Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'exit\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 30">
                                                            <path d="M11.79575,14.14675H8.119v-1.9775h4.2847v-1.4356H6.33915v8.5327h6.0865v-1.4209H8.119v-2.2705h3.6768Z"></path>
                                                            <path d="M15.47575,10.73365h-2.0655l2.7539,4.2334-2.8198,4.2993h2.0801l1.831-2.9956,1.8677,2.9956h2.1094l-2.9004-4.2993,2.7466-4.2334h-2.0801l-1.7725,2.9517Z"></path>
                                                            <path d="M24.57565,10.73365h-1.7725v8.5327h1.7725Z"></path>
                                                            <path d="M33.66085,10.73365h-7.3974v1.4356h2.7905v7.0971h1.7798v-7.0971h2.8271Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button id="`+data["uuid"]+`-dirsbtn" onclick="document.getElementById('`+data["uuid"]+`-dirs').style.display='none';document.getElementById('`+data["uuid"]+`-keyboard').style.display='block';this.style.display='none';document.getElementById('`+data["uuid"]+`-keyboardbtn').style.display='block';">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M8.09119,12.40918A2.59079,2.59079,0,1,0,10.682,15,2.59067,2.59067,0,0,0,8.09119,12.40918Zm13.81763,0A2.59079,2.59079,0,1,0,24.49951,15,2.59077,2.59077,0,0,0,21.90881,12.40918ZM15,5.50037a2.59082,2.59082,0,1,0,2.59082,2.59082A2.59077,2.59077,0,0,0,15,5.50037Zm0,6.90881A2.59079,2.59079,0,1,0,17.59082,15,2.59077,2.59077,0,0,0,15,12.40918ZM15,19.318a2.59079,2.59079,0,1,0,2.59082,2.59082A2.59077,2.59077,0,0,0,15,19.318Zm-6.90881,0A2.59079,2.59079,0,1,0,10.682,21.90881,2.59067,2.59067,0,0,0,8.09119,19.318Zm13.81763,0a2.59079,2.59079,0,1,0,2.5907,2.59082A2.59077,2.59077,0,0,0,21.90881,19.318Zm0-8.636A2.59082,2.59082,0,1,0,19.318,8.09119,2.59067,2.59067,0,0,0,21.90881,10.682ZM8.09119,5.50037A2.59082,2.59082,0,1,0,10.682,8.09119,2.59067,2.59067,0,0,0,8.09119,5.50037Z" fill-rule="evenodd"></path>
                                                        </svg>
                                                    </button>
                                                    <button id="`+data["uuid"]+`-keyboardbtn" style="display:none;" onclick="document.getElementById('`+data["uuid"]+`-dirs').style.display='block';document.getElementById('`+data["uuid"]+`-keyboard').style.display='none';this.style.display='none';document.getElementById('`+data["uuid"]+`-dirsbtn').style.display='block';">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M8.76341,15.0001a6.20253,6.20253,0,0,1,1.2768-3.7715l-3.387-3.3872a10.9866,10.9866,0,0,0,0,14.3171l3.387-3.3869A6.20253,6.20253,0,0,1,8.76341,15.0001Zm10.0083,4.9598a6.2094,6.2094,0,0,1-7.5435,0l-3.3867,3.3869a10.9866,10.9866,0,0,0,14.3171,0Zm2.4651-4.9598a6.19875,6.19875,0,0,1-1.2771,3.7715l3.387,3.3869a10.98629,10.98629,0,0,0,0-14.3171l-3.387,3.387A6.20231,6.20231,0,0,1,21.23681,15.0001Zm-10.0086-4.9599a6.20886,6.20886,0,0,1,7.5434,0l3.387-3.3869a10.98629,10.98629,0,0,0-14.3171,0Zm8.4496,4.9599a4.6778,4.6778,0,1,1-4.6776-4.6778A4.67775,4.67775,0,0,1,19.67781,15.0001Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volminus\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volminusoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volminus\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volminusoff\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M13.31763,9.3938V20.60248a.90206.90206,0,0,1-.907.89691L8.28076,18.35931H5.25244a1,1,0,0,1-1-.99994V12.64056a1.00009,1.00009,0,0,1,1-1H8.27637l4.13428-3.14337A.902.902,0,0,1,13.31763,9.3938Zm12.42944,5.27209c-.00049-.35339-.2-.65692-.43262-.65771l-8.12964.032c-.23242-.00055-.4314.30212-.43091.65552l.001.65631c.00024.35358.19946.65662.43164.65741l8.13037-.032c.23218.00079.43115-.3017.43066-.65533Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volplus\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volplusoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volplus\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'volplusoff\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M13.31787,9.3938V20.60248a.90227.90227,0,0,1-.90723.89691L8.28076,18.35931H5.25244a1,1,0,0,1-1-.99994V12.64056a1.00009,1.00009,0,0,1,1-1H8.27637l4.13428-3.14337A.90217.90217,0,0,1,13.31787,9.3938Zm12.4292,5.27209c-.00049-.35339-.2002-.65692-.43237-.65771L22.24,14.02026l-.01221-3.088c.00073-.23242-.302-.43121-.65527-.43085l-.65649.00073c-.35352.00037-.65649.19971-.65723.43188l.012,3.09393-3.08594.01215c-.23267-.00055-.4314.30212-.43091.65552l.001.65631c.00024.35358.19946.65662.43164.65741l3.092-.01215.012,3.06726c-.00049.23218.30176.43085.65527.4306l.65625-.00073c.35352-.00037.657-.19977.658-.43219L22.2478,15.9895l3.06909-.01208c.23218.00079.43115-.3017.43066-.65533Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'prgminus\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'prgminusoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'prgminus\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'prgminusoff\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M24.62573,16.32208c.00049.35364-.19849.65613-.43066.65533l-8.13037.032c-.23218-.00079-.4314-.30383-.43188-.65741l-.00073-.65631c-.00024-.35339.19849-.65607.43091-.65552l8.12988-.032c.23242.00079.43164.30432.43213.65771ZM11.88794,11.97681a4.79867,4.79867,0,0,1,.14868,1.188,3.93137,3.93137,0,0,1-.24561,1.4527,2.638,2.638,0,0,1-.68384,1.014,2.84908,2.84908,0,0,1-1.06323.59021,4.58811,4.58811,0,0,1-1.3833.19672h-1.145v4.313H5.37427V9.92621H9.12183a3.047,3.047,0,0,1,1.37549.28,2.51979,2.51979,0,0,1,.89966.734A2.89513,2.89513,0,0,1,11.88794,11.97681ZM9.895,13.195a1.93937,1.93937,0,0,0-.342-1.24091,1.39128,1.39128,0,0,0-1.145-.42371H7.51562v3.28387h.9519A1.39818,1.39818,0,0,0,9.501,14.42078,1.67037,1.67037,0,0,0,9.895,13.195Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'prgplus\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'prgplusoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'prgplus\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'prgplusoff\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M24.62573,16.32208c.00049.35364-.19849.65613-.43066.65533L21.126,16.9895l.01221,3.07269c-.001.23242-.3042.43182-.65771.43219l-.65625.00073c-.35376.00024-.656-.19843-.65552-.4306l-.012-3.06726-3.092.01215c-.23218-.00079-.4314-.30383-.43188-.65741l-.00073-.65631c-.00024-.35339.19849-.65607.43091-.65552l3.08594-.01215-.01221-3.09393c.001-.23218.304-.43152.65747-.43188l.65649-.00073c.35327-.00037.656.19843.65527.43085l.01221,3.088,3.07471-.01208c.23242.00079.43164.30432.43213.65771ZM11.88794,11.97681a4.79867,4.79867,0,0,1,.14868,1.188,3.93137,3.93137,0,0,1-.24561,1.4527,2.638,2.638,0,0,1-.68384,1.014,2.84908,2.84908,0,0,1-1.06323.59021,4.58811,4.58811,0,0,1-1.3833.19672h-1.145v4.313H5.37427V9.92621H9.12183a3.047,3.047,0,0,1,1.37549.28,2.51979,2.51979,0,0,1,.89966.734A2.89513,2.89513,0,0,1,11.88794,11.97681ZM9.895,13.195a1.93937,1.93937,0,0,0-.342-1.24091,1.39128,1.39128,0,0,0-1.145-.42371H7.51562v3.28387h.9519A1.39818,1.39818,0,0,0,9.501,14.42078,1.67037,1.67037,0,0,0,9.895,13.195Z"></path>
                                                        </svg>
                                                    </button>
                                                    <div id="`+data["uuid"]+`-dirs" style="position:relative;width:100%;height:320px;top:160px;">
                                                        <button style="position:absolute;left:0px;top:5px;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'menu\')">
                                                            <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                                <rect x="8.49994" y="14" width="13.00012" height="2"></rect>
                                                                <rect x="8.49994" y="18" width="13.00012" height="2"></rect>
                                                                <rect x="8.49994" y="10" width="13.00012" height="2"></rect>
                                                            </svg>
                                                        </button>
                                                        <button style="position:absolute;right:0px;top:5px;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'info\')">
                                                            <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                                <rect x="9" y="8.5005" width="2.50012" height="3"></rect>
                                                                <polygon points="23 14 20 14 20 11 18 11 18 14 15 14 15 16 18 16 18 19 20 19 20 16 23 16 23 14" fill-rule="evenodd"></polygon>
                                                                <rect x="9" y="13.5005" width="2.50012" height="8"></rect>
                                                            </svg>
                                                        </button>
                                                        <svg style="height:260px;position:absolute;left:70px;top:-20px;fill:rgba(50, 50, 55, 0.7);" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 185 185">
                                                            <path class="buttonbg" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirok\')" d="M92.5,47.00143A45.4986,45.4986,0,1,1,47.00145,92.5,45.49849,45.49849,0,0,1,92.5,47.00143Z"></path>
                                                            <path class="buttonbg" onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirup\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirupoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirup\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirupoff\')" d="M92.50006,41.80475a50.44816,50.44816,0,0,1,34.024,13.13843l29.59106-29.59125a92.49009,92.49009,0,0,0-127.2287-.00134L58.47748,54.94189A50.44836,50.44836,0,0,1,92.50006,41.80475Z"></path>
                                                            <path class="buttonbg" onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirleft\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirleftoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirleft\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirleftoff\')" d="M41.84375,92.5A50.52915,50.52915,0,0,1,54.94556,58.48047L25.35107,28.88586a92.48994,92.48994,0,0,0,.00122,127.22961l29.59436-29.59454A50.52948,50.52948,0,0,1,41.84375,92.5Z"></path>
                                                            <path class="buttonbg" onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirright\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirrightoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirright\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirrightoff\')" d="M159.64783,28.88464,130.05341,58.47931a50.718,50.718,0,0,1,.00116,68.04022L159.649,156.1142a92.49011,92.49011,0,0,0-.00116-127.22955Z"></path>
                                                            <path class="buttonbg" onmousedown="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirdown\')" onmouseup="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirdownoff\')" ontouchstart="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirdown\')" ontouchstop="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'dirdownoff\')" d="M92.50006,143.19531A50.4486,50.4486,0,0,1,58.47614,130.057l-29.591,29.59125a92.49,92.49,0,0,0,127.22864.0011L126.52264,130.058A50.44794,50.44794,0,0,1,92.50006,143.19531Z"></path>
                                                            <path class="buttonsvg" d="M91.492,171.42475l-6.8945-9.5584c-.5544-.7684-.3905-1.3977.363-1.3977h15.0793c.7528,0,.9174.6293.363,1.3977l-6.8945,9.5584A1.171,1.171,0,0,1,91.492,171.42475Z"></path>
                                                            <path class="buttonsvg" d="M13.5766,91.49246l9.5796-6.8923c.7697-.5542,1.4005-.3904,1.4005.3629v15.0741c0,.7526-.6308.9172-1.4005.3629l-9.5796-6.8922A1.16886,1.16886,0,0,1,13.5766,91.49246Z"></path>
                                                            <path class="buttonsvg" d="M171.42347,93.508l-9.5817,6.8937c-.7702.5543-1.4012.3905-1.4012-.363V84.961c0-.7526.631-.9172,1.4012-.363l9.5817,6.8937A1.16972,1.16972,0,0,1,171.42347,93.508Z"></path>
                                                            <path class="buttonsvg" d="M93.5075,13.57531l6.8898,9.5569c.554.7682.3902,1.3975-.3629,1.3975H84.9653c-.7521,0-.9169-.6293-.3628-1.3975l6.8899-9.5569A1.17,1.17,0,0,1,93.5075,13.57531Z"></path>
                                                        </svg>
                                                        <button style="position:absolute;left:0px;bottom:5px;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'return\')">
                                                            <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                                <path d="M19.99874,10.07621V9.92308H13.00008V7.56535c0-.33557-.30011-.40857-.66644-.16168L7.77535,10.4741a.50466.50466,0,0,0,0,.89807l4.55829,3.0705c.36633.24689.66644.17352.66644-.16168V11.92308h5.49878v6h-9v2h10a1.00008,1.00008,0,0,0,1.00012-1v-8A.98568.98568,0,0,0,19.99874,10.07621Z" fill-rule="evenodd"></path>
                                                            </svg>
                                                        </button>
                                                        <button style="position:absolute;right:0px;bottom:5px;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'guide\')">
                                                            <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                                <path d="M13.99994,9H7.00006V21H22.99994V9ZM8.00006,10h4.99988v2H8.00006Zm0,3h4.99988v3H8.00006Zm0,7V17h4.99988v3Zm13.99988,0h-8V10h8Z" fill-rule="evenodd"></path>
                                                                <path d="M22,10V20H8V10H22m1-2H7A1,1,0,0,0,6,9V21a1,1,0,0,0,1,1H23a1,1,0,0,0,1-1V9a1,1,0,0,0-1-1Z"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <div id="`+data["uuid"]+`-keyboard" style="position:relative;width:300px;height:500px;left:50px;top:160px;display:none;">
                                                        <input type="text" id="`+data["uuid"]+`-keyboardvalue" style="background-color:rgba(50, 50, 55, 0.7);border:none;outline:none;border-radius:5px;color:rgb(235, 235, 245);width:260px;height:50px;font-size:18px;padding-left:10px;padding-right:10px;margin-bottom:10px;">
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num1\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='1';">1</button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num2\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='2';">2</button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num3\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='3';">3</button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num4\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='4';">4</button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num5\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='5';">5</button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num6\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='6';">6</button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num7\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='7';">7</button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num8\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='8';">8</button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num9\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='9';">9</button>
                                                        <button style="background-color:#69c350;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'number/\'+document.getElementById('`+data["uuid"]+`-keyboardvalue').value);document.getElementById('`+data["uuid"]+`-keyboardvalue').value='';">
                                                            <svg style="height:70%;margin:0;padding-top:5px;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 30 30" style="enable-background:new 0 0 30 30;" xml:space="preserve">
                                                                <path d="M22.13,8.56l-0.04-0.03c-0.44-0.3-1.04-0.19-1.36,0.23L13,19.03l-3.95-2.88c-0.44-0.32-1.06-0.23-1.39,0.21L7.6,16.44c-0.33,0.45-0.24,1.08,0.21,1.4l4.88,3.57c0.44,0.33,1.07,0.23,1.39-0.21l8.29-11.22C22.72,9.52,22.6,8.87,22.13,8.56z"></path>
                                                            </svg>
                                                        </button>
                                                        <button style="font-size:20px;color:rgb(235, 235, 245);" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'num0\');document.getElementById('`+data["uuid"]+`-keyboardvalue').value+='0';">0</button>
                                                        <button style="background-color:#e73246;" onclick="document.getElementById('`+data["uuid"]+`-keyboardvalue').value='';">
                                                            <svg style="height:70%;margin:0;padding-top:5px;" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px" viewBox="0 0 30 30" style="enable-background:new 0 0 30 30;" xml:space="preserve">
                                                                <path d="M20.66,22.07L15,16.41l-5.66,5.66c-0.39,0.39-1.02,0.39-1.41,0h0c-0.39-0.39-0.39-1.02,0-1.41L13.59,15L7.93,9.34c-0.39-0.39-0.39-1.02,0-1.41l0,0c0.39-0.39,1.02-0.39,1.41,0L15,13.59l5.66-5.66c0.39-0.39,1.02-0.39,1.41,0v0c0.39,0.39,0.39,1.02,0,1.41L16.41,15l5.66,5.66c0.39,0.39,0.39,1.02,0,1.41l0,0C21.68,22.46,21.05,22.46,20.66,22.07z"></path>
                                                            </svg>
                                                        </button>
                                                    </div>
                                                    <button style="margin-top:190px;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'mute\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M13.39179,8.41293l-4.1911,3.19043H6.13574a1,1,0,0,0-1,1v4.79688a1,1,0,0,0,1,1H9.20538l4.1864,3.18683a.91354.91354,0,0,0,.91821-.90875V9.32144A.91349.91349,0,0,0,13.39179,8.41293Z"></path>
                                                            <path d="M24.72125,17.54794,21.926,14.758l2.75873-2.75372a.50535.50535,0,0,0-.00122-.703l-.35278-.35217a.50858.50858,0,0,0-.70471-.00122l-2.7851,2.78058-2.76843-2.76306a.50773.50773,0,0,0-.70416-.00122l-.35181.351a.50553.50553,0,0,0,.00128.703L19.813,14.80832l-2.78564,2.7804a.50577.50577,0,0,0,.00122.70325l.35291.352a.5077.5077,0,0,0,.70428.0014l2.81268-2.8075-.0271-.02722,2.79523,2.79022a.50779.50779,0,0,0,.70441.0011l.35168-.351A.50541.50541,0,0,0,24.72125,17.54794Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button style="margin-top:190px;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'play\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M20.17631,15.85687l-9.5325,5.8596c-.7663.4712-1.3938.3318-1.3938-.3086V8.592c0-.6398.6275-.7798,1.3938-.3087l9.5325,5.8597A.92689.92689,0,0,1,20.17631,15.85687Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button style="margin-top:190px;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'pause\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M9.4999,8.5h3.5782a.93621.93621,0,0,1,.9218,1v11a.93621.93621,0,0,1-.9218,1H9.4999a1,1,0,0,1-.9999-1V9.5A1,1,0,0,1,9.4999,8.5Zm7.422,0H20.5a1,1,0,0,1,1,1v11a1,1,0,0,1-1,1H16.9219A.936.936,0,0,1,16,20.5V9.5A.93629.93629,0,0,1,16.9219,8.5Z" fill-rule="evenodd"></path>
                                                        </svg>
                                                    </button>
                                                    <button style="margin-top:190px;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'stop')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M9.49983,8.4998h11.0004a1,1,0,0,1,1,1V20.5002a1,1,0,0,1-1,1H9.49983a1.00007,1.00007,0,0,1-1.0001-1V9.4998A1.00007,1.00007,0,0,1,9.49983,8.4998Z" fill-rule="evenodd"></path>
                                                        </svg>
                                                    </button>
                                                    <button onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'previous\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M22.01414,9.44226,15.848,13.887V9.69751c0-.53-.43726-.64526-.97083-.25525L8.68955,13.96118V9.842A.842.842,0,0,0,7.84763,9h-.0033a.842.842,0,0,0-.84216.842v10.3158A.842.842,0,0,0,7.84434,21h.0033a.842.842,0,0,0,.84192-.84216v-4.1189l6.18762,4.519c.53357.38989.97083.274.97083-.25537V16.11316L22.01414,20.558c.54077.38989.98364.274.98364-.25537V9.69751C22.99778,9.16748,22.55491,9.05225,22.01414,9.44226Z" fill-rule="evenodd"></path>
                                                        </svg>
                                                    </button>
                                                    <button onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'rewind\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M21.98282,9.23806l-6.538,4.691V9.50283c0-.54956-.4613-.66895-1.02441-.26477L7.4141,14.265a.85176.85176,0,0,0,0,1.47021l7.00635,5.02686c.56311.40417,1.02441.28418,1.02441-.26465V16.07119l6.538,4.69092c.56311.40417,1.02454.28418,1.02454-.26465V9.50283C23.00736,8.95327,22.54593,8.83389,21.98282,9.23806Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'forward\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M22.57175,14.265,15.58286,9.23954c-.56177-.40405-1.02185-.28394-1.02185.26465v4.432L8.02964,9.23954c-.56165-.40405-1.02185-.28394-1.02185.26465V20.49564c0,.54919.46021.6687,1.02185.26465L14.561,16.06363v4.432c0,.54919.46008.6687,1.02185.26465l6.98889-5.02551A.85246.85246,0,0,0,22.57175,14.265Z"></path>
                                                        </svg>
                                                    </button>
                                                    <button onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'next\')">
                                                        <svg style="height:70%;margin:0;padding-top:5px;" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 30">
                                                            <path d="M23.00139,14.99866V9.614a.864.864,0,0,0-.864-.864h-.00781a.864.864,0,0,0-.864.864v3.68018l-5.595-4.09338c-.55591-.40674-1.01111-.28589-1.01111.26636v4.59875L8.00957,9.20081c-.55566-.40674-1.01111-.28589-1.01111.26636V20.53247c0,.553.45544.67322,1.01111.26648l6.6499-4.86511v4.59863c0,.553.4552.67322,1.01111.26648l5.595-4.09338v3.6803a.86405.86405,0,0,0,.864.86414h.00781a.86405.86405,0,0,0,.864-.86414V14.99866Z" fill-rule="evenodd"></path>
                                                        </svg>
                                                    </button>
                                                    <button style="background-color:#e73246;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'btnred\')"></button>
                                                    <button style="background-color:#69c350;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'btngreen\')"></button>
                                                    <button style="background-color:#fdd835;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'btnyellow\')"></button>
                                                    <button style="background-color:#00b0db;" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'btnblue\')"></button>
                                                </div>
                                            </div>
                                        `;
                                    break;
                                    case "NfcCodeTouch":
                                        control = `
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                        valueLine = false;
                                    break;
                                    case "Sauna":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                        fullControl = `

                                        `;
                                    break;
                                    case "Intercom":
                                        fullControl = `

                                        `;
                                        valueLine = false;
                                    break;
                                    case "Webpage":
                                        control = `
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                                                        <path d="M320 0c-17.7 0-32 14.3-32 32s14.3 32 32 32h82.7L201.4 265.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L448 109.3V192c0 17.7 14.3 32 32 32s32-14.3 32-32V32c0-17.7-14.3-32-32-32H320zM80 32C35.8 32 0 67.8 0 112V432c0 44.2 35.8 80 80 80H400c44.2 0 80-35.8 80-80V320c0-17.7-14.3-32-32-32s-32 14.3-32 32V432c0 8.8-7.2 16-16 16H80c-8.8 0-16-7.2-16-16V112c0-8.8 7.2-16 16-16H192c17.7 0 32-14.3 32-32s-14.3-32-32-32H80z"/>
                                                    </svg>
                                                </button>
                                            </div>
                                        `;
                                        fullControl = `

                                        `;
                                        valueLine = false;
                                    break;
                                }
                                var tcenterline = "";

                                if(!valueLine) tcenterline = " tcenter";
                                all.innerHTML += '<div class="item'+tcenterline+'" id="'+data["uuid"]+'" data-menu="control" data-room="'+data["room"]+'" data-category="'+data["category"]+'" data-rating="'+data["rating"]+'" onclick="showPanel(this.id, event)"><p class="title">'+data["title"]+'</p>'+control+'</div>';
                                getSvg(data["svg"], data["uuid"]);
                                openned.innerHTML += fullControl;
                                if(data["rating"] > 0) {
                                    rated.innerHTML += '<div class="item" id="'+data["uuid"]+'-r" data-menu="control" data-room="'+data["room"]+'" data-category="'+data["category"]+'" onclick="showPanel(this.id.replace(\'-r\',\'\'), event)"><p class="title">'+data["title"]+'</p>'+control+'<p class="category">'+data["roomname"]+'</p></div>';
                                    getSvg(data["svg"], data["uuid"]+"-r");
                                }
                            break;
                            case "room":
                                all.innerHTML += '<div class="item-title" data-subtitle="'+data["uuid"]+'" style="display:none;"><p>'+data["title"]+'</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg></div>';
                                all.innerHTML += '<div class="item tcenter" id="'+data["uuid"]+'" data-menu="room" data-rating="'+data["rating"]+'" onclick="showRoom(this.id)"><p class="title">'+data["title"]+'</p></div>';
                                getSvg(data["svg"], data["uuid"]);
                                if(data["rating"] > 0) {
                                    rated.innerHTML += '<div class="item lcenter" id="'+data["uuid"]+'-r" data-menu="room" onclick="showRoom(\''+data["uuid"]+'\')"><p class="title">'+data["title"]+'</p></div>';
                                    getSvg(data["svg"], data["uuid"]+"-r");
                                }
                            break;
                            case "category":
                                all.innerHTML += '<div class="item-title" data-subtitle="'+data["uuid"]+'" style="display:none;"><p>'+data["title"]+'</p><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M233.4 406.6c12.5 12.5 32.8 12.5 45.3 0l192-192c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L256 338.7 86.6 169.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l192 192z"/></svg></div>';
                                all.innerHTML += '<div class="item tcenter" id="'+data["uuid"]+'" data-menu="category" data-rating="'+data["rating"]+'" onclick="showCategory(this.id)"><p class="title">'+data["title"]+'</p></div>';
                                getSvg(data["svg"], data["uuid"]);
                                if(data["rating"] > 0) {
                                    rated.innerHTML += '<div class="item lcenter" id="'+data["uuid"]+'-r" data-menu="category" onclick="showCategory(\''+data["uuid"]+'\')"><p class="title">'+data["title"]+'</p></div>';
                                    getSvg(data["svg"], data["uuid"]+"-r");
                                }
                            break;
                        }
                    break;
                    case "update":
                        switch(data["type"]) {
                            case "InfoOnlyDigital":
                                if(data["subtype"] == "value")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "InfoOnlyAnalog":
                                if(data["subtype"] == "value")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                            break;
                            case "Switch":
                                if(data["subtype"] == "value")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.checked = data["value"];
                                    });
                            break;
                            case "TextState":
                                if(data["subtype"] == "value")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                            break;
                            case "Meter":
                                if(data["color"])
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.style.color = data["color"];
                                    });
                                switch(data["itemtype"]) {
                                    case "storage":
                                        if(data["subtype"] == "storage")
                                            document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                                itm.innerHTML = data["value"];
                                            });
                                        else
                                            document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                                itm.innerHTML = data["value"];
                                            });
                                    break;
                                    case "unidirectional":
                                        if(data["subtype"] == "actual")
                                            document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                                itm.innerHTML = data["value"];
                                            });
                                        else
                                            document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                                itm.innerHTML = data["value"];
                                            });
                                    break;
                                    case "bidirectional":
                                        if(data["subtype"] == "actual")
                                            document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                                itm.innerHTML = data["value"];
                                            });
                                        else
                                            document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                                itm.innerHTML = data["value"];
                                            });
                                    break;
                                }
                            break;
                            case "EIBDimmer":
                                if(data["subtype"] == "dimmer") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"]+"%";
                                        itm.style.color = data["color"];
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                        itm.value = data["value"];
                                        slider(itm.id);
                                    });
                                }
                                if(data["subtype"] == "dimmersw")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                        itm.checked = data["value"];
                                    });
                            break;
                            case "IRoomControllerV2":
                                if(data["subtype"] == "activemode")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "PresenceDetector":
                                if(data["subtype"] == "active")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "value")
                                    if(data["value"] == 0)
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                            itm.innerHTML = "--:-- --.--.----";
                                        });
                                if(data["subtype"] == "from")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                            break;
                            case "TimedSwitch":
                                
                            break;
                            case "LeftRightAnalog":
                                if(data["subtype"] == "value")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                            break;
                            case "Pushbutton":
                                
                            break;
                            case "Irrigation":
                                if(data["subtype"] == "currentzone")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "active")
                                    if(data["value"] == 0) {
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                            itm.style.display = "block";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                            itm.style.display = "none";
                                        });
                                    } else {
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                            itm.style.display = "none";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                            itm.style.display = "block";
                                        });
                                    }
                            break;
                            case "SmokeAlarm":
                                if(data["subtype"] == "level")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "active")
                                    if(data["value"] == 0) {
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                            itm.style.display = "block";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                            itm.style.display = "none";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                            itm.style.display = "none";
                                        });
                                    } else {
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                            itm.style.display = "none";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                            itm.style.display = "block";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                            itm.style.display = "block";
                                        });
                                    }
                                if(data["subtype"] == "signals")
                                    if(data["value"] == 0)
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                            itm.disabled = false;
                                            itm.innerHTML = "Vypnout výstupy alarmu";
                                        });
                                    else
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                            itm.disabled = true;
                                            itm.innerHTML = "Výstupy alarmu byly vypnuty";
                                        });
                            break;
                            case "EnergyManager2":
                                if(data["subtype"] == "status")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "battery") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                        itm.innerHTML = data["value"].storagePowerFormat;
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value4']").forEach(function(itm) {
                                        itm.innerHTML = data["value"].storageChargeFormat;
                                    });
                                }
                                if(data["subtype"] == "loads")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value9']").forEach(function(itm) {
                                        itm.innerHTML = '';
                                        data["value"].forEach(function(item, index) {
                                            var st = item.active == 1 ? "border: 2px solid rgb(105, 195, 80);" : "border: 2px solid gray;";
                                            itm.innerHTML += `
                                                <div class="order-row">
                                                    <svg style="`+st+`" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512">
                                                        <path d="M349.4 44.6c5.9-13.7 1.5-29.7-10.6-38.5s-28.6-8-39.9 1.8l-256 224c-10 8.8-13.6 22.9-8.9 35.3S50.7 288 64 288H175.5L98.6 467.4c-5.9 13.7-1.5 29.7 10.6 38.5s28.6 8 39.9-1.8l256-224c10-8.8 13.6-22.9 8.9-35.3s-16.6-20.7-30-20.7H272.5L349.4 44.6z"/>
                                                    </svg>
                                                    <p class="name">`+item.power+`</p>
                                                    <p class="subname">`+item.name+`</p>
                                                    <p class="subsubname">`+item.state+`</p>
                                                    <select id="`+data["uuid"]+`-value1`+index+`" onchange="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'mode:`+index+`:\'+this.value)">
                                                        <option value="automatic"`+ (item.number == 0 ? " selected" : "") +`>Automatika</option>
                                                        <option value="activate"`+ (item.number == 1 ? " selected" : "") +`>Zapnuto do půlnoci</option>
                                                        <option value="deactivate"`+ (item.number == 2 ? " selected" : "") +`>Vypnuto do půlnoci</option>
                                                    </select>
                                                </div>
                                            `;
                                        });
                                    });
                                if(data["subtype"] == "minstorage") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value5']").forEach(function(itm) {
                                        itm.innerHTML = data["value"]+"%";
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value6']").forEach(function(itm) {
                                        itm.value = data["value"];
                                        slider(itm.id);
                                    });
                                }
                                if(data["subtype"] == "maxstorage") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value7']").forEach(function(itm) {
                                        itm.innerHTML = data["value"]+" kW";
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value8']").forEach(function(itm) {
                                        itm.value = data["value"];
                                        slider(itm.id);
                                    });
                                }
                                if(data["subtype"] == "custompower") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                        itm.style.color = data["value"].color;
                                        itm.innerHTML = data["value"].percent+"% "+data["value"].total+" kW";
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                        itm.style.color = data["value"].freeColor;
                                        itm.innerHTML = data["value"].freePercent+"% "+data["value"].freeTotal+" kW";
                                    });
                                    if(charts[data["uuid"]+"-chart"]) {
                                        charts[data["uuid"]+"-chart"].data.setAll([
                                            { name: "Vlastní spotřeba", value: data["value"].percent },
                                            { name: "Ze sítě", value: 100-data["value"].percent }
                                        ]);
                                    } else {
                                        var root = am5.Root.new(data["uuid"]+"-chart");
                                        var chart = root.container.children.push(am5percent.PieChart.new(root, {
                                            layout: root.verticalLayout,
                                            innerRadius: am5.percent(80)
                                        }));
                                        charts[data["uuid"]+"-chart"] = chart.series.push(am5percent.PieSeries.new(root, {
                                            valueField: "value",
                                            categoryField: "name",
                                            alignLabels: false
                                        }));
                                        charts[data["uuid"]+"-chart"].get("colors").set("colors", [
                                            am5.color(0x69c350),
                                            am5.color(0xf7b55c)
                                        ]);
                                        charts[data["uuid"]+"-chart"].data.setAll([
                                            { name: "Vlastní", value: data["value"].percent },
                                            { name: "Ze sítě", value: 100-data["value"].percent }
                                        ]);
                                    }
                                }
                            break;
                            case "EFM":
                                if(data["color"])
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "grid")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                if(data["subtype"] == "storage") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                    var itms = document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']");
                                    if(itms[0] && itms[0].innerHTML == "N/A")
                                        itms.forEach(function(itm) {
                                            itm.innerHTML = "";
                                        });
                                }
                            break;
                            case "Wallbox2":
                                if(data["color"])
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "connected")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                if(data["subtype"] == "enabled")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                if(data["subtype"] == "power")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value5']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                if(data["subtype"] == "charge")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value6']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                if(data["subtype"] == "started")
                                    if(data["value"] == 1) {
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                            itm.style.display = "block";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value4']").forEach(function(itm) {
                                            itm.style.display = "none";
                                        });
                                    } else {
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                            itm.style.display = "none";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value4']").forEach(function(itm) {
                                            itm.style.display = "block";
                                        });
                                    }
                                if(data["subtype"] == "mode") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value7']").forEach(function(itm) {
                                        itm.value = data["value"].toString();
                                    });
                                }
                                if(data["subtype"] == "modes")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value7']").forEach(function(itm) {
                                        if(itm.innerHTML == "")
                                            data["value"].forEach(function(item) {
                                                if(item.name != "")
                                                    itm.innerHTML += '<option value="'+item.id+'">'+item.name+'</option>';
                                            });
                                    });
                                if(data["subtype"] == "limit") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value8']").forEach(function(itm) {
                                        itm.innerHTML = data["value"].format;
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value9']").forEach(function(itm) {
                                        itm.value = data["value"].value;
                                        slider(itm.id);
                                    });
                                }
                            break;
                            case "LoadManager":
                                if(data["subtype"] == "available")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "AalSmartAlarm":
                                if(data["subtype"] == "alarm")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "Alarm":
                                if(data["subtype"] == "level")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "cmode")
                                    data["value"].forEach(function(item, index) {
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value"+(index+1)+"']").forEach(function(itm) {
                                            itm.style.display = item;
                                        });
                                    });
                                if(data["subtype"] == "movement")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value5']").forEach(function(itm) {
                                        itm.checked = !data["value"];
                                    });
                            break;
                            case "AalEmergency":
                                if(data["subtype"] == "alarm")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "PulseAt":
                                if(data["subtype"] == "pulse")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "WindowMonitor":
                                if(data["subtype"] == "open")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "tilted")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "offline")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "update")
                                    data["value"].forEach(function(item, index) {
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value"+(index+4)+"']").forEach(function(itm) {
                                            itm.innerHTML = item.text;
                                            itm.style.color = item.color;
                                        });
                                    });
                            break;
                            case "CentralLightController":
                                
                            break;
                            case "CentralJalousie":
                                
                            break;
                            case "ClimateController":
                                if(data["subtype"] == "vent")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "LightControllerV2":
                                if(data["subtype"] == "moodlist") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                        data["value"].forEach(function(item) {
                                            itm.innerHTML += `
                                                <button class="b1 moods" data-id="`+data["uuid"]+`-mood`+item.id+`" onclick="lxControl(\'`+data["uuid"]+`\', \'`+data["type"]+`\', \'setmood:`+item.id+`\')">`+item.name+`</button>
                                            `;
                                        });
                                    });
                                    if(colors[data["uuid"]]) {

                                    } else {
                                        colors[data["uuid"]+"1"] = new iro.ColorPicker("#colorselect1-"+data["uuid"], {
                                            width: 290,
                                            height: 360,
                                            handleRadius: 8,
                                            activeHandleRadius: 10,
                                            handleUrl: null,
                                            handleOrigin: {y: 0, x: 0},
                                            colors: [
                                              '#ffffff'
                                            ],
                                            borderWidth: 10,
                                            borderColor: 'rgb(30, 30, 30)',
                                            padding: 8,
                                            margin: 0,
                                            wheelLightness: true,
                                            layoutDirection: 'vertical',
                                            layout: [
                                              {
                                                component: iro.ui.Wheel,
                                                options: {
                                                  wheelDirection: 'clockwise',
                                                  wheelAngle: 0,
                                                }
                                              }
                                            ]
                                        });
                                        colors[data["uuid"]+"1"].on('color:change', function(color) {
                                            console.log(color.hexString);
                                            lxControl(data["uuid"], "LightControllerV2", "color:");
                                        });
                                        colors[data["uuid"]+"2"] = new iro.ColorPicker("#colorselect2-"+data["uuid"], {
                                            width: 290,
                                            height: 360,
                                            handleRadius: 8,
                                            activeHandleRadius: 10,
                                            handleUrl: null,
                                            handleOrigin: {y: 0, x: 0},
                                            colors: [
                                              '#ffffff'
                                            ],
                                            borderWidth: 10,
                                            borderColor: 'rgb(30, 30, 30)',
                                            padding: 8,
                                            margin: 0,
                                            wheelLightness: true,
                                            layoutDirection: 'vertical',
                                            layout: [
                                              {
                                                component: iro.ui.Slider,
                                                options: {
                                                  sliderType: 'kelvin',
                                                  sliderShape: 'circle'
                                                }
                                              }
                                            ]
                                        });
                                        colors[data["uuid"]+"2"].on('color:change', function(color) {
                                            console.log(color.hexString);
                                        });
                                    }
                                }
                                if(data["subtype"] == "activemood") {
                                    data["value"]
                                    document.getElementById(data["uuid"]+"-open").querySelectorAll("button.moods").forEach(function(item) {
                                        item.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-mood"+data["value"]+"']").forEach(function(itm) {
                                        itm.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                                    });
                                }
                                if(data["subtype"] == "mood")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "ColorPickerV2":
                                
                            break;
                            case "AlarmClock":
                                if(data["subtype"] == "clock")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "Window":
                                if(data["subtype"] == "position")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "Jalousie":
                                if(data["subtype"] == "position")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "auto")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value6']").forEach(function(itm) {
                                        itm.checked = data["value"];
                                    });
                            break;
                            case "Gate":
                                if(data["subtype"] == "position")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "Ventilation":
                                if(data["subtype"] == "speed")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "Radio":
                                if(data["subtype"] == "state")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "update") {
                                    document.getElementById(data["uuid"]+"-open").querySelectorAll("button").forEach(function(item) {
                                        item.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value"+(data["value"]+3)+"']").forEach(function(itm) {
                                        itm.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                                    });
                                }
                            break;
                            case "Remote":
                                if(data["subtype"] == "mode")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                                if(data["subtype"] == "update") {
                                    document.getElementById(data["uuid"]+"-open").querySelectorAll("button.b1").forEach(function(item) {
                                        item.style.backgroundColor = "rgba(255, 255, 255, 0.1)";
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value"+data["value"]+"']").forEach(function(itm) {
                                        itm.style.backgroundColor = "rgba(255, 255, 255, 0.3)";
                                    });
                                    document.getElementById(data["uuid"]+"-open").querySelectorAll(".tv-controller").forEach(function(item) {
                                        if(data["value"] == 0)
                                            item.style.display = "none";
                                        else
                                            item.style.display = "block";
                                    });
                                }
                            break;
                            case "NfcCodeTouch":
                                
                            break;
                            case "Sauna":
                                if(data["subtype"] == "turn")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
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
                    break;
                }
            break;
        }
    };

    function shrinkSentence(sentence, maxLength) {
        if(sentence.length <= maxLength) return sentence;
        var smallSentence = sentence.substr(0, maxLength);
        var lastSpaceIndex = smallSentence.lastIndexOf(' ');
        if(lastSpaceIndex !== -1) smallSentence = smallSentence.substr(0, lastSpaceIndex);
        smallSentence += '...';
        return smallSentence;
    }

    function smallerSentece(sentence, maxLength) {
        return sentence.substring(0, maxLength-1)+"...";
    }

    if("webkitSpeechRecognition" in window) {
        var SpeechRecognition = SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition_thread = new SpeechRecognition();
        speechRecognition_thread.continuous = false;
        speechRecognition_thread.lang = "cs-CZ";
        speechRecognition_thread.interimResults = false;
        speechRecognition_thread.onresult = function(event) {
            var current = event.resultIndex;
            var transcript = event.results[current][0].transcript;
           /* speechRecognition_buble.style.opacity = "1";
            speechRecognition_buble.innerHTML = transcript;
            setTimeout(function() {
                speechRecognition_buble.style.opacity = "0";
                speechRecognition_buble.innerHTML = "";
            }, 3000);*/
            console.log(transcript);
            connection.send(JSON.stringify({ module: "speech", sentence: transcript }));
        }
        speechRecognition_thread.onend = function() {
            //speechRecognition_thread.start();
        }
        speechRecognition_thread.start();
    } else console.warn("Speech Recognition is not supported in your browser!");

    addListeners();

    function addListeners() {
        menuItems[0].addEventListener("click", function() {
            menuItems[0].style.backgroundColor = "rgba(1, 101, 194, 0.1)";
            menuItems[1].style.backgroundColor = "transparent";
            menuItems[2].style.backgroundColor = "transparent";
            menuItems[3].style.backgroundColor = "transparent";
            document.getElementById("alltitle").style.display = "none";
            document.querySelectorAll("[data-subtitle]").forEach(function(i) {
                i.style.display = "none";
            });
            document.querySelectorAll("[data-favorite=true]").forEach(function(item) {
                item.style.display = "block";
            });
            document.querySelectorAll("[data-menu=control]").forEach(function(item) {
                item.style.display = "none";
            });
            document.querySelectorAll("[data-menu=room]").forEach(function(item) {
                item.style.display = "none";
            });
            document.querySelectorAll("[data-menu=category]").forEach(function(item) {
                item.style.display = "none";
            });
        });
        menuItems[1].addEventListener("click", function() {
            menuItems[0].style.backgroundColor = "transparent";
            menuItems[1].style.backgroundColor = "rgba(1, 101, 194, 0.1)";
            menuItems[2].style.backgroundColor = "transparent";
            menuItems[3].style.backgroundColor = "transparent";
            document.getElementById("alltitle").style.display = "block";
            document.querySelectorAll("[data-subtitle]").forEach(function(i) {
                i.style.display = "none";
            });
            document.querySelectorAll("[data-menu=control]").forEach(function(item) {
                item.style.display = "none";
            });
            document.querySelectorAll("[data-menu=room]").forEach(function(item) {
                var itemid = item.id.includes("-r") ? item.id.replace("-r","") : item.id;
                if(document.querySelectorAll("[data-room='"+itemid+"']").length > 0)
                    item.style.display = "block";
            });
            document.querySelectorAll("[data-menu=category]").forEach(function(item) {
                item.style.display = "none";
            });
        });
        menuItems[2].addEventListener("click", function() {
            menuItems[0].style.backgroundColor = "transparent";
            menuItems[1].style.backgroundColor = "transparent";
            menuItems[2].style.backgroundColor = "rgba(1, 101, 194, 0.1)";
            menuItems[3].style.backgroundColor = "transparent";
            document.getElementById("alltitle").style.display = "block";
            document.querySelectorAll("[data-subtitle]").forEach(function(i) {
                i.style.display = "none";
            });
            document.querySelectorAll("[data-menu=control]").forEach(function(item) {
                item.style.display = "none";
            });
            document.querySelectorAll("[data-menu=room]").forEach(function(item) {
                item.style.display = "none";
            });
            document.querySelectorAll("[data-menu=category]").forEach(function(item) {
                var itemid = item.id.includes("-r") ? item.id.replace("-r","") : item.id;
                if(document.querySelectorAll("[data-category='"+itemid+"']").length > 0)
                    item.style.display = "block";
            });
        });
        menuItems[3].addEventListener("click", function() {
            menuItems[0].style.backgroundColor = "transparent";
            menuItems[1].style.backgroundColor = "transparent";
            menuItems[2].style.backgroundColor = "transparent";
            menuItems[3].style.backgroundColor = "rgba(1, 101, 194, 0.1)";
            document.getElementById("alltitle").style.display = "block";
            document.querySelectorAll("[data-subtitle]").forEach(function(i) {
                i.style.display = "none";
            });
            document.querySelectorAll("[data-menu=control]").forEach(function(item) {
                if(!item.getAttribute("data-rating"))
                    item.style.display = "none";
            });
            document.querySelectorAll("[data-menu=control]").forEach(function(item) {
                if(item.getAttribute("data-rating"))
                    item.style.display = "block";
            });
            document.querySelectorAll("[data-menu=room]").forEach(function(item) {
                item.style.display = "none";
            });
            document.querySelectorAll("[data-menu=category]").forEach(function(item) {
                item.style.display = "none";
            });
        });
    }

    async function getSvg(path, id) {
        /*if(path) $.get("assets/images/"+path).done((svg) => {
            document.getElementById(id).innerHTML = new XMLSerializer().serializeToString(svg) + document.getElementById(id).innerHTML;
        });*/
        document.getElementById(id).innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill-rule="evenodd" d="M13.377 11.461c.376-.272.623-.712.623-1.211 0-.827-.673-1.5-1.5-1.5h-1c-.827 0-1.5.673-1.5 1.5 0 .499.247.939.623 1.211A1.998 1.998 0 0 0 9.5 13.25c0 1.102.897 2 2 2h1c1.103 0 2-.898 2-2 0-.786-.461-1.463-1.123-1.789ZM12.5 9.75a.5.5 0 0 1 0 1h-1a.5.5 0 0 1 0-1h1Zm-1 4.5a1.001 1.001 0 0 1 0-2h1a1.001 1.001 0 0 1 0 2h-1Z" clip-rule="evenodd"/><path fill-rule="evenodd" d="M24 12c0 6.627-5.373 12-12 12S0 18.627 0 12 5.373 0 12 0s12 5.373 12 12Zm-6 0a6 6 0 1 1-12 0 6 6 0 0 1 12 0Z" clip-rule="evenodd"/></svg>'+document.getElementById(id).innerHTML;
    }

    function updateDate() {
        var date = new Date();
        dateDay.innerHTML = days[date.getDay()];
        dateDate.innerHTML = date.getDate()+". "+months[date.getMonth()]+" "+date.getFullYear();
        var hours = date.getHours();
        var minutes = date.getMinutes();
        if(hours<10) hours = "0"+hours;
        if(minutes<10) minutes = "0"+minutes;
        dateTime.innerHTML = hours+":"+minutes;
    }
};

function slider(id) {
	var slider = document.getElementById(id);
    valPercent = ((slider.value - slider.min) / (slider.max - slider.min))*100;
    slider.style.background = `linear-gradient(to right, rgb(235, 235, 245) ${valPercent}%, rgba(255, 255, 255, 0.1) ${valPercent}%)`;
}

function showPanel(id, event) {
    if(event != null && document.getElementById(id+"-open")) {
        if(event.target.nodeName.toLowerCase() === "button") return;
        if(event.target.nodeName.toLowerCase() === "svg") return;
        if(event.target.nodeName.toLowerCase() === "path") return;
        if(event.target.nodeName.toLowerCase() === "label") return;
        if(event.target.nodeName.toLowerCase() === "span") return;
        if(event.target.nodeName.toLowerCase() === "input") return;
        document.getElementById(id+"-open").style.display = "block";
        rated.style.display = "none";
        all.style.display = "none";
        openned.style.display = "block";
    }
}

function closePanel(id) {
    document.getElementById(id).style.display = "none";
    rated.style.display = "block";
    all.style.display = "block";
    openned.style.display = "none";
}

function showRoom(uuid) {
    var cats = [];
    document.getElementById("alltitle").style.display = "none";
    document.querySelectorAll("[data-menu=room]").forEach(function(item) {
        item.style.display = "none";
    });
    document.querySelectorAll("[data-room='"+uuid+"']").forEach(function(i) {
        if(i.getAttribute("data-category") && document.querySelector("[data-subtitle='"+i.getAttribute("data-category")+"']")) {
            document.querySelector("[data-subtitle='"+i.getAttribute("data-category")+"']").style.display = "block";
        }
    });
    document.querySelectorAll("[data-subtitle]").forEach(function(i) {
        if(i.style.display != "none") cats.push(i.getAttribute("data-subtitle"));
    });
    document.querySelectorAll("[data-room='"+uuid+"']").forEach(function(i) {
        if(i.getAttribute("data-rating")) {
            if(i.getAttribute("data-category") && document.querySelector("[data-subtitle='"+i.getAttribute("data-category")+"']")) {
                var after = cats.indexOf(i.getAttribute("data-category"))+1;
                if(cats[after]) {
                    all.insertBefore(i, document.querySelector("[data-subtitle='"+cats[after]+"']"));
                    i.style.display = "block";
                } else {
                    all.appendChild(i);
                    i.style.display = "block";
                }
            }
        } else {
            i.style.display = "block";
        }
    });
}

function showCategory(uuid) {
    var rooms = [];
    document.getElementById("alltitle").style.display = "none";
    document.querySelectorAll("[data-menu=category]").forEach(function(item) {
        item.style.display = "none";
    });
    document.querySelectorAll("[data-category='"+uuid+"']").forEach(function(i) {
        if(i.getAttribute("data-room") && document.querySelector("[data-subtitle='"+i.getAttribute("data-category")+"']")) {
            document.querySelector("[data-subtitle='"+i.getAttribute("data-room")+"']").style.display = "block";
        }
    });
    document.querySelectorAll("[data-subtitle]").forEach(function(i) {
        if(i.style.display != "none") rooms.push(i.getAttribute("data-subtitle"));
    });
    document.querySelectorAll("[data-category='"+uuid+"']").forEach(function(i) {
        if(i.getAttribute("data-rating")) {
            if(i.getAttribute("data-room") && document.querySelector("[data-subtitle='"+i.getAttribute("data-category")+"']")) {
                var after = rooms.indexOf(i.getAttribute("data-room"))+1;
                if(rooms[after]) {
                    all.insertBefore(i, document.querySelector("[data-subtitle='"+rooms[after]+"']"));
                    i.style.display = "block";
                } else {
                    all.appendChild(i);
                    i.style.display = "block";
                }
            }
        } else {
            i.style.display = "block";
        }
    });
}

function timePrompt(hoursMin, hoursMax, minutesMin, minutesMax, callback) {
    var timeselector = document.getElementById("timeselector");
    var hElement = document.getElementById("selecthours")
    var mElement = document.getElementById("selectminutes");
    var selectedtime = document.getElementById("selectedtime");
    var totalseconds = document.getElementById("totalseconds");
    var selectedconfirm = document.getElementById("selectedconfirm");
    hElement.min = hoursMin;
    hElement.max = hoursMax;
    hElement.value = hoursMin;
    hElement.addEventListener("input", function() {
        hours = hElement.value;
        updateSelectedTime();
    });
    mElement.value = minutesMin;
    mElement.min = minutesMin;
    mElement.max = minutesMax;
    mElement.addEventListener("input", function() {
        minutes = mElement.value;
        updateSelectedTime();
    });
    timeselector.style.display = "block";
    overlay.style.display = "block";
    function updateSelectedTime() {
        selectedtime.innerHTML = (hElement.value < 10 ? "0" + hElement.value : hElement.value) + ":" + (mElement.value < 10 ? "0" + mElement.value : mElement.value);
        totalseconds.value = hElement.value * 3600 + mElement.value * 60;
    }
    selectedconfirm.addEventListener("click", function() {
        timeselector.style.display = "none";
        overlay.style.display = "none";
        callback(totalseconds.value);
    });
}

function callChart() {
    var root = am5.Root.new("pie-chart");
    var chart = root.container.children.push(am5percent.PieChart.new(root, {
        layout: root.verticalLayout,
        innerRadius: am5.percent(80)
    }));
    var series = chart.series.push(am5percent.PieSeries.new(root, {
        valueField: "value",
        categoryField: "name",
        alignLabels: false
    }));
    series.get("colors").set("colors", [
        am5.color(0x69c350),
        am5.color(0xf7b55c)
    ]);
    series.data.setAll([
        { name: "One", value: 90 },
        { name: "Two", value: 10 }
    ]);
}