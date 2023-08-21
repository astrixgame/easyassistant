import websockets
import asyncio
import queue
import sounddevice as sd
from vosk import Model, KaldiRecognizer
import os.path

q = queue.Queue()

def callback(indata, frames, time, status):
    q.put(bytes(indata))

def find_between(s, first, last):
    try:
        start = s.index(first) + len(first)
        end = s.index(last, start)
        return s[start:end]
    except ValueError:
        return ""

async def main():
    while True:
        try:
            with sd.RawInputStream(samplerate=16000, blocksize=8000, dtype="int16", channels=1, callback=callback):
                async with websockets.connect("ws://localhost:34987/ws") as websocket:
                    rec = KaldiRecognizer(Model(model_path="models/cs-cz"), 16000)
                    while True:
                        data = q.get()
                        if rec.AcceptWaveform(data):
                            d = find_between(rec.Result().replace('"text"', ''), '"', '"')
                            if d:
                                print(d)
                                await websocket.send('{"module":"voice","value":"'+d+'"}')
                                await asyncio.sleep(0)
        except Exception as e:
            print(f"An error occurred: {str(e)}. Reconnecting in 10 seconds...")
            await asyncio.sleep(10)
if os.path.exists('EasyAssistant.address'):
    asyncio.get_event_loop().run_until_complete(main())
else:
    address = input("Your EasyAssistant Server Address (address:34987)")
