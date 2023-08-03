var connection = new WebSocket("ws://192.168.5.99:34987");
var dateDay = document.getElementById("date-day");
var dateDate = document.getElementById("date-date");
var dateTime = document.getElementById("date-clock");
var all = document.getElementById("all");
var rated = document.getElementById("rated");
var menuItems = document.querySelectorAll(".menu-item");
//var speechRecognition_start = document.getElementById("speechRecognition");
//var speechRecognition_buble = document.getElementById("speechBuble");
//var speechRecognition_thread = null;
var days = ["Neděle","Pondělí","Úterý","Středa","Čtvrtek","Pátek","Sobota"];
var months = ["Ledna","Února","Března","Dubna","Května","Června","Července","Srpna","Zíří","Října","Listopadu","Prosince"];
var connectionIntervalRetry = null;
var audio_notification = new Audio('assets/media/notification.mp3');

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
    }, 3000);*/
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
                                var valueLine = true;
                                switch(data["type"]) {
                                    case "InfoOnlyDigital":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                    break;
                                    case "InfoOnlyAnalog":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
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
                                        valueLine = false;
                                    break;
                                    case "TextState":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                    break;
                                    case "Meter":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">
                                                <txt data-id="`+data["uuid"]+`-value1">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value3">N/A</txt>
                                            </p>
                                        `;
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
                                    break;
                                    case "PresenceDetector":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
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
                                        valueLine = false;
                                    break;
                                    case "Irrigation":
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
                                    break;
                                    case "SmokeAlarm":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                    break;
                                    case "EnergyManager2":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value"></p>
                                        `;
                                    break;
                                    case "EFM":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">
                                                <txt data-id="`+data["uuid"]+`-value1">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                            </p>
                                        `;
                                    break;
                                    case "Wallbox2":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">
                                                <txt data-id="`+data["uuid"]+`-value1">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                            </p>
                                        `;
                                    break;
                                    case "LoadManager":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                    break;
                                    case "AalSmartAlarm":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                    break;
                                    case "Alarm":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                    break;
                                    case "AalEmergency":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
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
                                    break;
                                    case "WindowMonitor":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">
                                                <txt data-id="`+data["uuid"]+`-value1">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value2">N/A</txt>
                                                <txt data-id="`+data["uuid"]+`-value3">N/A</txt>
                                            </p>
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
                                        valueLine = false;
                                    break;
                                    case "ClimateController":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                    break;
                                    case "CentralAudioZone":
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
                                    break;
                                    case "Ventilation":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
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
                                    break;
                                    case "AudioZoneV2":
                                        valueLine = false;
                                    break;
                                    case "Remote":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                            <div class="control">
                                                <button data-id="`+data["uuid"]+`-value1">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512">
                                                        <path d="M533.6 32.5C598.5 85.3 640 165.8 640 256s-41.5 170.8-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/>
                                                    </svg>
                                                </button>
                                                <button id="`+data["uuid"]+`-value2">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 512">
                                                        <path d="M320 64c0-12.6-7.4-24-18.9-29.2s-25-3.1-34.4 5.3L131.8 160H64c-35.3 0-64 28.7-64 64v64c0 35.3 28.7 64 64 64h67.8L266.7 471.9c9.4 8.4 22.9 10.4 34.4 5.3S320 460.6 320 448V64z"/>
                                                    </svg>
                                                </button>
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
                                        valueLine = false;
                                    break;
                                    case "Sauna":
                                        control = `
                                            <p class="value" data-id="`+data["uuid"]+`-value">N/A</p>
                                        `;
                                    break;
                                    case "Intercom":
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
                                        valueLine = false;
                                    break;
                                }
                                var tcenterline = "";

                                if(!valueLine) tcenterline = " tcenter";
                                all.innerHTML += '<div class="item'+tcenterline+'" id="'+data["uuid"]+'" data-menu="control" data-room="'+data["room"]+'" data-category="'+data["category"]+'" data-rating="'+data["rating"]+'"><p class="title">'+data["title"]+'</p>'+control+'</div>';
                                getSvg(data["svg"], data["uuid"]);
                                if(data["rating"] > 0) {
                                    rated.innerHTML += '<div class="item" id="'+data["uuid"]+'-r" data-menu="control" data-room="'+data["room"]+'" data-category="'+data["category"]+'"><p class="title">'+data["title"]+'</p>'+control+'<p class="category">'+data["roomname"]+'</p></div>';
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
                                if(data["subtype"] == "storage") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                        itm.innerHTML = "";
                                    });
                                }
                                if(data["subtype"] == "actual") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value2']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                    var itms = document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']");
                                    if(itms[0] && itms[0].innerHTML == "N/A") {
                                        itms.forEach(function(itm) {
                                            itm.innerHTML = "";
                                        });
                                        document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                            itm.innerHTML = "";
                                        });
                                    }
                                }
                                if(data["subtype"] == "total") {
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value1']").forEach(function(itm) {
                                        itm.innerHTML = "";
                                    });
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value3']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                    });
                                }
                            break;
                            case "EIBDimmer":
                                if(data["subtype"] == "dimmer")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
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
                            break;
                            case "SmokeAlarm":
                                if(data["subtype"] == "level")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
                            break;
                            case "EnergyManager2":
                                if(data["subtype"] == "status")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
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
                                if(data["subtype"] == "mood")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
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
                            break;
                            case "Remote":
                                if(data["subtype"] == "mode")
                                    document.querySelectorAll("[data-id='"+data["uuid"]+"-value']").forEach(function(itm) {
                                        itm.innerHTML = data["value"];
                                        itm.style.color = data["color"];
                                    });
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

    }
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