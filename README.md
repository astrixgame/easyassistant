# Easy Assistant (temp cs-CZ only)
<h2>Not fully functional yet</h2>Now it supports only <a href="https://www.loxone.com/">Loxone Miniserver</a><br>
In the future it will have more connection with hubs.<br>
<h2>About us</h2>
Easy Assistant is software designed to make life easier. Featuring voice recognition technology, the intelligent Easy Assistant responds instantly to voice commands, such as turning lights on or off, adjusting thermostat settings. It can detect your presence, and automatically adjust the temperature, lighting and other settings to create a comfortable environment while also conserving energy.<br><br>The assistant must be connected to the main controller like Loxone or other hub that we support.<br><br>The voice controling is running on the <a href="https://en.wikipedia.org/wiki/Jaro%E2%80%93Winkler_distance">Jaro Winkler Distance</a> Algorithm which means that the voice command can perform actions when the sentence is not corrent said or when the name of control is not said full and the Speech Recognition (ASR) is currently running os <a href="https://github.com/alphacep/vosk-api">Vosk</a> from <a href="https://alphacephei.com/vosk/">Alphacephei</a>

<h2>How to download model</h2>
You can download it from <a href="https://alphacephei.com/vosk/models">https://alphacephei.com/vosk/models</a>
<br>
It will download as modelname.zip then copy it into server models folder <strong>withnout unzipping it</strong><br>

<h2>How to run</h2>
You need <strong>port 80 free</strong> because the web intreface running on it
Download the latest release from: <a href="https://github.com/astrixgame/easy-assistant/releases">https://github.com/astrixgame/easyassistant/releases</a> or you can download it from git:<pre>git clone https://github.com/astrixgame/easyassistant.git</pre>
Go to the folder:<pre>cd easyassistant</pre>
And run the server:<pre>node .</pre>or<pre>node server.js</pre>
<h2>How to run the server</h2>
<ol>
  <li>Download server.zip from Releases and unzip it</li>
  <li>Configure the server
  <pre>{                                              
    "hub": {                                   
        "type": "loxone",                      <-- Name of hub like loxone or other supported hubs
        "address": "Address:Port",             <-- Address and port of your hub
        "user": "Username",                    <-- Login Username of your hub
        "password": "SuperSecretPassword",     <-- Login Password of your hub
        "controlNameAlias": {                  
            "uuid1": "alias name 1",           <-- If your control named like bulb and you want to tell light bulb you can change this
            "uuid2": "alias name 2"            
        },
        "controlIgnore": [
            "uuid1",                           <-- Ignored controls that will not show up in the interface and cannot be controlled by voice
            "uuid2"
        ],
        "removedWordFromName": [
            "name1",                           <-- If some control named like heat thermostat you can remove the word heat from name by adding it there but it will be removed from all controls of your hub
            "name2"
        ]
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
