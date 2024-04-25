import base64
import json
import os
from datetime import datetime, timedelta
from typing import Optional
import cv2
import jwt
import librosa
import numpy as np
import openai
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from jwt import PyJWTError
from keras.src.saving.saving_api import load_model
from passlib.context import CryptContext
from pydantic import BaseModel
from pymongo import MongoClient
from starlette.middleware.cors import CORSMiddleware
from starlette.responses import StreamingResponse, JSONResponse
from starlette.staticfiles import StaticFiles
from starlette.websockets import WebSocketDisconnect

from audio_processing import router
from camera_socket import HandDrums

app = FastAPI()
origins = [
    "*",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database configuration
client = MongoClient("mongodb://root:bt_mongodb@103.45.68.99:27278/")
db = client["user_db"]
users_collection = db["users"]
invalid_tokens_collection = db["invalid_tokens"]

# Password hashing configuration
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Authentication configuration
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
SECRET_KEY = "c1e31accde01383e5eeadd595fa2a2f5b9c922c8c91eb16df742f71ef4acc8e4"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

# Models
class User(BaseModel):
    username: str
    email: Optional[str] = None
    full_name: Optional[str] = None
    disabled: Optional[bool] = None


class UserInDB(User):
    hashed_password: str


class WebsocketRequest(BaseModel):
    username: str


# User management functions
def get_user(username: str):
    user_dict = users_collection.find_one({"username": username})
    if user_dict:
        return UserInDB(**user_dict)


def authenticate_user(username: str, password: str):
    user = get_user(username)
    if not user:
        return False
    if not pwd_context.verify(password, user.hashed_password):
        return False
    return user


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


# Authentication endpoints
@app.post("/register")
async def register(form_data: OAuth2PasswordRequestForm = Depends()):
    hashed_password = pwd_context.hash(form_data.password)
    user_dict = {"username": form_data.username, "hashed_password": hashed_password}
    try:
        users_collection.insert_one(user_dict)
    except:
        return {"message": "User created unsuccessfully"}
    return {"message": "User created successfully"}


@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    user = authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED,
                            detail="Incorrect username or password")
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}


@app.get("/users/me")
async def read_users_me(current_user: User = Depends(get_current_user)):
    return current_user


@app.post("/logout")
async def logout(token: str = Depends(oauth2_scheme)):
    invalid_tokens_collection.insert_one({"token": token})
    return {"message": "Logged out successfully"}


# Utility functions
def load_a_file(file_path):
    n_mfcc = 20
    y, sr = librosa.load(file_path, mono=True, sr=None)
    y = y[::3]
    mfcc = librosa.feature.mfcc(y=y, sr=22050, n_mfcc=n_mfcc)
    if 30 > mfcc.shape[1]:
        pad_width = 30 - mfcc.shape[1]
        mfcc = np.pad(mfcc, pad_width=((0, 0), (0, pad_width)), mode='constant')
    else:
        mfcc = mfcc[:, :30]
    return mfcc


# Load the pre-trained genre classification model
model = load_model('model.h5')

genre_map = {
    0: 'blues',
    1: 'classical',
    2: 'country',
    3: 'disco',
    4: 'hiphop',
    5: 'jazz',
    6: 'metal',
    7: 'pop',
    8: 'reggae',
    9: 'rock'
}


# Audio analysis endpoint
@app.get("/analyze")
async def analyze(filename: str):
    audio_path = f"audio/{filename}/music.wav"
    y, sr = librosa.load(audio_path)

    lyrics_path = f"audio/{filename}/lyric.lrc"
    lyrics = []
    if os.path.exists(lyrics_path):
        with open(lyrics_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line:
                    time_str, text = line.split("]", 1)
                    time_str = time_str[1:]
                    minutes, seconds = time_str.split(":")
                    total_seconds = int(minutes) * 60 + float(seconds)
                    time_ms = int(total_seconds * 1000)
                    lyrics.append({"time": time_ms, "text": text})

    # Audio analysis
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    librosa.feature.chroma_stft(y=y, sr=sr)
    pitch = librosa.yin(y, fmin=librosa.note_to_hz('C2'), fmax=librosa.note_to_hz('C7'))

    # Genre classification
    test_mfcc = load_a_file(audio_path)
    test_mfcc_final = test_mfcc.reshape(1, 20, 30, 1)
    predicted_genre_index = np.argmax(model.predict(test_mfcc_final))
    genre = genre_map[predicted_genre_index]

    return JSONResponse(content={
        "tempo": float(tempo),
        "pitch": pitch.tolist(),
        "genre": genre,
        "lyrics": lyrics
    })


# GPT suggestion generation endpoint
@app.get("/generate_gpt_suggestion")
async def generate_gpt_suggestion(prompt: str):
    async def event_generator():
        openai.api_key = "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"
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[{"role": "user", "content": prompt}],
            max_tokens=1500,
            stop=None,
            temperature=0.7,
            stream=True
        )

        generated_text = ' '
        for chunk in response:
            if 'choices' in chunk:
                choice = chunk['choices'][0]
                if 'delta' in choice and 'content' in choice['delta']:
                    content = choice['delta']['content']
                    generated_text += content.strip()
                    yield f"{content}"

    return StreamingResponse(event_generator(), media_type='text/event-stream')


# WebSocket functionality
active_connections = {}


@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket, token: str):
    await websocket.accept()
    try:
        print("token:", token)
    except PyJWTError:
        await websocket.close(code=status.WS_1008_POLICY_VIOLATION)
        return

    hand_drums = HandDrums()
    active_connections[token] = (websocket, hand_drums)

    try:
        while True:
            message = await websocket.receive_text()

            data = json.loads(message)
            frame_data = data['frame']
            frame_array = np.frombuffer(base64.b64decode(frame_data), dtype=np.uint8)
            frame = cv2.imdecode(frame_array, cv2.IMREAD_COLOR)

            processed_frame = await hand_drums.process_frame(frame)

            await websocket.send_json(processed_frame)
    except WebSocketDisconnect:
        del active_connections[token]


@app.post("/create_websocket")
async def create_websocket(request_data: WebsocketRequest):
    username = request_data.username
    try:
        print(username)
        user = get_user(username)
        if user is None:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    except PyJWTError:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED)
    return {"websocket_url": f"/ws?token={username}"}


# Router and static file mounting
app.include_router(router, prefix="/process_audio", tags=["Audio Processing"])
app.mount("/audio", StaticFiles(directory="audio"), name="audio")
app.mount("/audio_output", StaticFiles(directory="audio_output"), name="audio_output")