# Easy Assistant (temp cs-CZ only)
<h2>Not fully functional yet</h2>Now it supports only <a href="https://www.loxone.com/">Loxone Miniserver</a><br>
In the future it will have more connection with hubs.<br>
<h2>About us</h2>
Easy Assistant is software designed to make life easier. Featuring voice recognition technology, the intelligent Easy Assistant responds instantly to voice commands, such as turning lights on or off, adjusting thermostat settings. It can detect your presence, and automatically adjust the temperature, lighting and other settings to create a comfortable environment while also conserving energy.<br><br>The assistant must be connected to the main controller like Loxone or Home Assistant or something else.

<h2>How to download model</h2>
You can download it from <a href="https://alphacephei.com/vosk/models">https://alphacephei.com/vosk/models</a>
<br>
It will download as modelname.zip then copy it into server models folder <strong>withnout unzipping it</strong><br>

<h2>How to run</h2>
You need these free ports: <ul><li>34987 - EasyAssistantServer (REQUIRED)</li><li>80 - WebInterface (REQUIRED)</li></ul>
Download the latest release from: <a href="https://github.com/astrixgame/easy-assistant/releases">https://github.com/astrixgame/easyassistant/releases</a> and run it <i>as administrator is recommended</i>
<h2>How to run the server</h2>
<ol>
  <li>Download server.zip from Releases and unzip it</li>
  <li>Configure the server
  <pre>{                                              
    "hub": {                                   
        "type": "loxone",                      <-- Name of hub like loxone or other supported hubs
        "address": "Address:Port",             <-- Address and port of your hub
        "user": "Username",                    <-- Login Username of your hub
        "password": "SuperSecretPassword"      <-- Login Password of your hub
    },                                         
    "language": "en-us",                       <-- Language of the interface and the voice
    "weather": {                               
        "from": "hub",                         <-- Where the weather be taken from hub for hub or openweather
        "openWeatherToken": ""                 <-- If in the row up below filled up with openweather fill this with openweather token
    },                                         
    "voiceActivateSentences": "hey"            <-- Activation sentence can be everything and you can add more than one separated by comma for example it will be there hey ... or only hey
}</pre></li>
  <li>Run the server by starting script that have name of your OS and 64 bits ...</li>
  <li>Test it by simply openning your server address and if everything works it will show and interface filled with controls panels of your hub</li>
  <li>(Optional) Install the client-app for voice controling you can select between many types and version of it, so for example if you want only voice recognition background app you can install from Releases voice_server app, but there are many types of client some of that will include interface and more features.</li>
</ol>