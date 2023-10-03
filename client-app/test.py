import speech_recognition as sr

r = sr.Recognizer()

speech = sr.Microphone(device_index=1)
with speech as source:
     audio = r.adjust_for_ambient_noise(source)
     audio = r.listen(source)
try:
    recog = r.recognize_google(audio, language = 'cs-CZ')
    print("You said: " + recog)
except sr.RequestError as e:
    print("E")