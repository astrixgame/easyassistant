# Easy Assistant (cs-CZ)
<h2>Not fully functional yet</h2>Now it supports only <a href="https://www.loxone.com/">Loxone Miniserver</a><br>
In the future it will have more connection with hubs.<br>
After the EasyAssistant will be fully operational I'll publish the C++ or C# console app of the server side.
<h2>About us</h2>
Easy Assistant is software designed to make life easier. Featuring voice recognition technology, the intelligent Easy Assistant responds instantly to voice commands, such as turning lights on or off, adjusting thermostat settings. It can detect your presence, and automatically adjust the temperature, lighting and other settings to create a comfortable environment while also conserving energy.<br><br>The assistant must be connected to the main controller like Loxone or Home Assistant or something else.

<h2>How to run</h2>
You need these free ports: <ul><li>34987 - EasyAssistantServer (REQUIRED)</li><li>80 - WebInterface (REQUIRED)</li></ul>
Download the latest release from: <a href="https://github.com/astrixgame/easy-assistant/releases">https://github.com/astrixgame/easy-assistant/releases</a> and run it <i>as administrator is recommended</i>
<h2>How to run the server</h2>
You must have installed Node.js and Git<sub>For download</sub><br>
And run following commands:<br><br>
Download files
<pre>git clone https://github.com/astrixgame/easyassistant.git</pre>
Install modules
<pre>npm i axios chalk fs http lxcommunicator node-nlp readline ws</pre>
Rename config.sample.json to config.json and change the values for your use.<br><br>
Run the server
<pre>node server.js</pre>
<h2>Contact us</h2>
Website, Forum: <a href="http://easyassistant.clanweb.eu/home/">http://easyassistant.clanweb.eu</a><br>
YouTube: <a href="https://www.youtube.com/@easyassistant">https://www.youtube.com/@easyassistant</a><br>
Mail: <a href="mailto:contact.easyassistant@gmail.com">contact.easyassistant@gmail.com</a>