<!DOCTYPE html>
<html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Webové Rozhraní / Easy Assistant</title>
        <link rel="shortcut icon" href="assets/images/favicon.png">
        <link rel="stylesheet" href="assets/styles/main.css">
        <link rel="stylesheet" href="assets/styles/interface.css">
        <link rel="stylesheet" href="https://erikflowers.github.io/weather-icons/css/weather-icons.css">
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/3.6.4/jquery.min.js"></script>
        <script src="assets/scripts/prefixfree.min.js"></script>
        <script src="assets/scripts/TweenMax.min.js"></script>
        <script src="assets/scripts/ThrowPropsPlugin.min.js"></script>
        <script src="assets/scripts/Draggable.min.js"></script>
    </head>
    <body>
        <div class="container">
            <div class="topbar">
                <div class="left">

                </div>
                <img src="assets/images/favicon.png" class="logo" draggable="false">
                <div class="right">
                    <txt id="date-day">Úterý</txt>
                    <txt id="date-date">21. Června 2023</txt>
                    <txt id="date-time">12:35</txt>
                </div>
            </div>
            
            <div class="panels" id="panels">
                <div class="p-menu" id="p-menu">
                    <div class="item item-back" id="lxMenuBack" onclick=" closeOpnened()">
                        <svg viewBox="0 0 448 512" xmlns="http://www.w3.org/2000/svg" ><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z"/></svg>
                    </div>
                    <div class="item" id="lxMenu1">
                        <svg id="lxMenu1svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M4.586 22.66a.916.916 0 00.754.182c.28-.05.585-.197.915-.441l5.697-4.19 5.708 4.19c.33.244.635.391.915.441.28.05.532-.01.754-.183.223-.165.357-.386.404-.662.047-.276.002-.609-.134-.996l-2.251-6.71 5.75-4.125c.338-.236.571-.48.7-.732.13-.251.151-.51.065-.775a.985.985 0 00-.506-.582c-.251-.13-.585-.194-1.002-.194l-7.054.054-2.143-6.742c-.129-.394-.292-.692-.49-.893A.967.967 0 0011.952 0c-.273 0-.508.1-.705.302-.198.2-.361.499-.49.893L8.614 7.937l-7.055-.054c-.416 0-.75.065-1.001.194a.985.985 0 00-.506.582.976.976 0 00.064.775c.13.251.363.496.7.732l5.751 4.125-2.25 6.71c-.137.387-.182.72-.135.996.046.276.181.497.404.662z"></path></svg>
                    </div>
                    <div class="item" id="lxMenu2">
                        <svg id="lxMenu2svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path fill-rule="evenodd" clip-rule="evenodd" d="M21.5 9.447c0 1.348-.284 2.63-.795 3.79-1.708 4.2-5.764 7.527-7.677 8.923a1.737 1.737 0 01-2.066 0C8.85 20.617 4.12 16.719 2.83 11.89a9.38 9.38 0 01-.33-2.443c0-.134.006-.265.018-.394C2.726 4.018 6.894 0 12.005 0 17.249 0 21.5 4.23 21.5 9.447zM12 13a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"></path></svg>
                    </div>
                    <div class="item" id="lxMenu3">
                        <svg id="lxMenu3svg" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path d="M11.824 1.433a1 1 0 00-1.696.077l-4.5 8A1 1 0 006.5 11h10a1 1 0 00.824-1.567l-5.5-8zM22.5 18a5 5 0 11-10 0 5 5 0 0110 0zM1.5 14.5a1 1 0 011-1h7a1 1 0 011 1v7a1 1 0 01-1 1h-7a1 1 0 01-1-1v-7z"></path></svg>
                    </div>
                </div>
                <div class="controling" id="controling"></div>
                <div class="openned-panels" id="openned-panels"></div>
            </div>

            <div class="weather">
                <div class="weather-col" id="weather1">
                    <txt id="weather-1-icon"><i class="wi wi-day-sunny"></i></txt>
                    <txt class="weather-title">Aktuálně</txt>
                    <txt class="weather-temp"><txt id="weather-1-temperature">N/A</txt> °C</txt>
                </div>
                <div class="weather-col" id="weather2">
                    <txt id="weather-2-icon"><i class="wi wi-day-sunny"></i></txt>
                    <txt class="weather-title">Večer</txt>
                    <txt class="weather-temp"><txt id="weather-2-temperature">N/A</txt> °C</txt>
                </div>
                <div class="weather-col" id="weather3">
                    <txt id="weather-3-icon"><i class="wi wi-day-sunny"></i></txt>
                    <txt class="weather-title">Zítra</txt>
                    <txt class="weather-temp"><txt id="weather-3-temperature">N/A</txt> °C</txt>
                </div>
                <div class="weather-col" id="weather4">
                    <txt id="weather-4-icon"><i class="wi wi-day-sunny"></i></txt>
                    <txt class="weather-title">Pozítří</txt>
                    <txt class="weather-temp"><txt id="weather-4-temperature">N/A</txt> °C</txt>
                </div>
                <div class="openned-weather" id="open-weather">
                    <div class="weather-preview" id="weather0">
                        <txt id="weather-0-icon"><i class="wi wi-day-sunny"></i></txt>
                        <txt class="weather-title" id="weather-0-title">Aktuálně</txt>
                        <txt class="weather-temp"><txt id="weather-0-temperature">N/A</txt> °C</txt>
                    </div>
                    <table>
                        <tr>
                            <td><strong>Teplota</strong></td>
                            <td><txt id="weather-temperature">N/A</txt> °C</td>
                            <td><strong>Zdánlivá Teplota</strong></td>
                            <td><txt id="weather-feeltemperature">N/A</txt> °C</td>
                        </tr>
                        <tr>
                            <td><strong>Tlak</strong></td>
                            <td><txt id="weather-pressure">N/A</txt> Pa</td>
                            <td><strong>Srážky</strong></td>
                            <td><txt id="weather-precip">N/A</txt> mm</td>
                        </tr>
                        <tr>
                            <td><strong>Vlhkost</strong></td>
                            <td><txt id="weather-humidity">N/A</txt> h</td>
                            <td><strong>Oblačnost</strong></td>
                            <td><txt id="weather-clouds">N/A</txt></td>
                        </tr>
                        <tr>
                            <td><strong>Rychlost Větru</strong></td>
                            <td><txt id="weather-windspeed">N/A</txt> mph</td>
                            <td><strong>Směr Větru</strong></td>
                            <td><txt id="weather-winddir">N/A</txt></td>
                        </tr>
                        <tr>
                            <td><strong>Východ Slunce</strong></td>
                            <td><txt id="weather-sunrise">N/A</txt></td>
                            <td><strong>Západ Slunce</strong></td>
                            <td><txt id="weather-sunset">N/A</txt></td>
                        </tr>
                    </table>
                </div>
            </div>


            <div class="radio">
                <img id="radio-image" draggable="false">
                <txt id="radio-title">FM4</txt>
                <txt id="radio-description">Kliknutím na špiku dozadu/dopředu přepneš rádio</txt>
                <div class="radio-volume">
                    <svg class="v-down" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><path d="M301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3zM412.6 181.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5z"/></svg>
                    <div id="v-container">
                        <svg id="stage">
                            <g id="slider-group">
                                <rect id="slider-inner" />
                                <g id="track-group">
                                    <rect id="track-inner" />
                                    <rect id="track-fill" />
                                </g>
                                <g id="handle-group">
                                    <circle id="handle-inner" />
                                </g>      
                            </g>    
                        </svg>
                    </div>
                    <svg class="v-up" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 512"><path d="M533.6 32.5C598.5 85.3 640 165.8 640 256s-41.5 170.8-106.4 223.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C557.5 398.2 592 331.2 592 256s-34.5-142.2-88.7-186.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM473.1 107c43.2 35.2 70.9 88.9 70.9 149s-27.7 113.8-70.9 149c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C475.3 341.3 496 301.1 496 256s-20.7-85.3-53.2-111.8c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zm-60.5 74.5C434.1 199.1 448 225.9 448 256s-13.9 56.9-35.4 74.5c-10.3 8.4-25.4 6.8-33.8-3.5s-6.8-25.4 3.5-33.8C393.1 284.4 400 271 400 256s-6.9-28.4-17.7-37.3c-10.3-8.4-11.8-23.5-3.5-33.8s23.5-11.8 33.8-3.5zM301.1 34.8C312.6 40 320 51.4 320 64V448c0 12.6-7.4 24-18.9 29.2s-25 3.1-34.4-5.3L131.8 352H64c-35.3 0-64-28.7-64-64V224c0-35.3 28.7-64 64-64h67.8L266.7 40.1c9.4-8.4 22.9-10.4 34.4-5.3z"/></svg>
                </div>
                <div class="controls">
                    <svg id="radio-back" class="radio-back" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M459.5 440.6c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29V96c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4L288 214.3V256v41.7L459.5 440.6zM256 352V256 128 96c0-12.4-7.2-23.7-18.4-29s-24.5-3.6-34.1 4.4l-192 160C4.2 237.5 0 246.5 0 256s4.2 18.5 11.5 24.6l192 160c9.5 7.9 22.8 9.7 34.1 4.4s18.4-16.6 18.4-29V352z"/></svg>
                    <svg id="radio-play" class="radio-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zM188.3 147.1c7.6-4.2 16.8-4.1 24.3 .5l144 88c7.1 4.4 11.5 12.1 11.5 20.5s-4.4 16.1-11.5 20.5l-144 88c-7.4 4.5-16.7 4.7-24.3 .5s-12.3-12.2-12.3-20.9V168c0-8.7 4.7-16.7 12.3-20.9z"/></svg>
                    <svg id="radio-pause" class="radio-play" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M464 256A208 208 0 1 0 48 256a208 208 0 1 0 416 0zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm224-72V328c0 13.3-10.7 24-24 24s-24-10.7-24-24V184c0-13.3 10.7-24 24-24s24 10.7 24 24zm112 0V328c0 13.3-10.7 24-24 24s-24-10.7-24-24V184c0-13.3 10.7-24 24-24s24 10.7 24 24z"/></svg>
                    <svg id="radio-next" class="radio-next" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><path d="M52.5 440.6c-9.5 7.9-22.8 9.7-34.1 4.4S0 428.4 0 416V96C0 83.6 7.2 72.3 18.4 67s24.5-3.6 34.1 4.4L224 214.3V256v41.7L52.5 440.6zM256 352V256 128 96c0-12.4 7.2-23.7 18.4-29s24.5-3.6 34.1 4.4l192 160c7.3 6.1 11.5 15.1 11.5 24.6s-4.2 18.5-11.5 24.6l-192 160c-9.5 7.9-22.8 9.7-34.1 4.4s-18.4-16.6-18.4-29V352z"/></svg>
                </div>
            </div>
        </div>
        <div class="model-overlay" id="modal-overlay">
            <div class="modal" id="modal">
                <h1 id="modal-title">Spojení Přerušeno</h1>
                <txt id="modal-text">Spojení se serverem bylo přešuno, z důvodu vypnutí nebo restartování serveru.<br><br>Probíhá opakovaný pokus o nové spojení.<br><br><br>Prosím vyčkejte</txt>
            </div>
        </div>
        <script src="assets/scripts/interface.js"></script>
    </body>
</html>