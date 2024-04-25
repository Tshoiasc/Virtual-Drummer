import os

from pydub import AudioSegment
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Optional
import time as tm
from fastapi import APIRouter


class DrumHit(BaseModel):
    volume: float
    velocity: float
    drumHit: str
    hand: str
    time: int


class AudioProcessingRequest(BaseModel):
    drum_hits: List[DrumHit]
    audio_filename: str


# 鼓声字典
drum_sounds = {
    "snare": "./effect/snareShort.wav",
    "high": "./effect/smash.wav",
    "high_tom": "effect/highShort.wav",
    "low_tom": "effect/lowSnare.wav"
}
router = APIRouter()


def process_audio(json_array: list, audio_filename: str):
    # 读取背景音乐
    background_music = AudioSegment.from_file(f"audio/{audio_filename}/music.wav", format="wav")

    # 遍历JSON数组
    for drum_hit in json_array:
        drum_type = drum_hit["drumHit"]
        volume = drum_hit["volume"]
        time = drum_hit["time"]

        if drum_type in drum_sounds:
            drum_sound = AudioSegment.from_file(drum_sounds[drum_type], format="wav")
            drum_sound = drum_sound - (1 - volume) * 6
            background_music = background_music.overlay(drum_sound, position=time)


    output_file = f"audio_output/{audio_filename}/output{tm.time()}.wav"
    try:
        # 尝试创建目录
        os.makedirs(f"audio_output/{audio_filename}", exist_ok=True)
    except OSError:
        print(f"error to create dir-{audio_filename}")
    background_music.export(output_file, format="wav")

    return output_file


@router.post("/process_audio")
async def process_audio_api(request: AudioProcessingRequest):
    print(request.drum_hits)
    json_array = [drum_hit.dict() for drum_hit in request.drum_hits]
    output_file = process_audio(json_array, request.audio_filename)

    return JSONResponse(content={"message": "Audio processing completed", "file_url": f"/{output_file}"})


class Song(BaseModel):
    title: str
    artist: str
    music_file: str
    cover_file: Optional[str] = None
    filename:str


@router.get("/songs", response_model=List[Song])
def get_songs():
    songs = []
    audio_dir = "audio"

    for folder in os.listdir(audio_dir):
        folder_path = os.path.join(audio_dir, folder)
        if os.path.isdir(folder_path):
            music_file = os.path.join(folder_path, "music.wav")
            cover_file = os.path.join(folder_path, "img.jpg")
            lyric_file = os.path.join(folder_path, "lyric.lrc")

            # 检查音乐文件是否存在
            if os.path.exists(music_file):
                title, artist = folder.split("-", 1)
                song = Song(
                    title=title,
                    artist=artist,
                    filename=title+'-'+artist,
                    music_file=music_file,
                    cover_file=cover_file if os.path.exists(cover_file) else None
                )
                songs.append(song)

    return songs
