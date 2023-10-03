import websockets
import asyncio
import queue
import sounddevice as sd
from vosk import Model, KaldiRecognizer
import os.path
import speech_recognition as sr

r = sr.Recognizer()

speech = sr.Microphone(device_index=1)

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
            connection = await websockets.connect("ws://localhost:80/ws", ping_interval=None)
            with speech as source:
                audio = r.adjust_for_ambient_noise(source)
                audio = r.listen(source)
            try:
                recog = r.recognize_google(audio, language = 'cs-CZ')
                print(recog)
                await connection.send('{"module":"voice","value":"'+recog+'"}')
                await asyncio.sleep(0)
            except sr.RequestError as e:
                print("E")
        except Exception as e:
            print(f"An error occurred: {str(e)}. Reconnecting in 10 seconds...")
            await asyncio.sleep(10)

asyncio.get_event_loop().run_until_complete(main())