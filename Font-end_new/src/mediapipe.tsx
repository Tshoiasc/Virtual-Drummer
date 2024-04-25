/* eslint-disable jsx-a11y/alt-text */
/* eslint-disable react-hooks/exhaustive-deps */
import React, { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import { Camera } from "@mediapipe/camera_utils";
import { Holistic, Results } from "@mediapipe/holistic";
import "./App.css";
import axios from "axios";
import {Button, Spin } from "antd";
import {RightCircleOutlined, PauseCircleOutlined} from '@ant-design/icons'
const highTomSound = require("./soundEffect/highShort.wav");
const snareSound = require("./soundEffect/snareShort.wav");
const lowTomSound = require("./soundEffect/lowSnare.wav");
const highSound = require("./soundEffect/smash.wav");
const HIGH_TOM_CENTER = [100, 380];
const SNARE_CENTER = [390, 380];
const LOW_TOM_CENTER = [540, 380];
const HIGH_CENTER = [240, 380];
const RADIUS = 60;
const MIN_VOLUME = 0.1; // 最小音量
const MAX_VOLUME = 1; // 最大音量
const VELOCITY_THRESHOLD = 10; // 速度阈值,低于这个值的速度将被视为最小速度
type DrumSoundKey = "high_tom" | "snare" | "low_tom" | "high";

const genre_colors ={
  "blues": {
    "color": "navy"
  },
  "classical": {
    "color": "darkred"
  },
  "country": {
    "color": "saddlebrown"
  },
  "disco": {
    "color": "violet"
  },
  "hipHop": {
    "color": "yellow"
  },
  "jazz": {
    "color": "darkgreen"
  },
  "metal": {
    "color": "black"
  },
  "pop": {
    "color": "hotpink"
  },
  "reggae": {
    "color": "yellowgreen"
  },
  "rock": {
    "color": "red"
  }
}

function isInCircle(x: number, y: number, center: number[], radius: number) {
  return (
    Math.pow(x - center[0], 2) + Math.pow(y - center[1], 2) <=
    Math.pow(radius, 2)
  );
}

function drawDrumstick(
  ctx: CanvasRenderingContext2D,
  x1: number,
  y1: number,
  x2: number,
  y2: number
) {
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  let colors:string = genre_colors[window.music.genre as keyof typeof genre_colors].color as keyof typeof String
  ctx.strokeStyle = colors;
  ctx.lineWidth = 3;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x2, y2, 10, 0, 2 * Math.PI);
  ctx.fillStyle = colors;
  ctx.fill();
}

function drawDrums(ctx: CanvasRenderingContext2D) {
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(HIGH_TOM_CENTER[0], HIGH_TOM_CENTER[1], RADIUS, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(SNARE_CENTER[0], SNARE_CENTER[1], RADIUS, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(LOW_TOM_CENTER[0], LOW_TOM_CENTER[1], RADIUS, 0, 2 * Math.PI);
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(HIGH_CENTER[0], HIGH_CENTER[1], RADIUS, 0, 2 * Math.PI);
  ctx.stroke();
}

class Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;

  constructor(x: number, y: number, vx: number, vy: number, color: string) {
    this.x = x;
    this.y = y;
    this.vx = vx;
    this.vy = vy;
    this.color = color;
    this.alpha = 1;
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 0.05;
  }

  draw(ctx: CanvasRenderingContext2D) {
    ctx.save();
    ctx.globalAlpha = this.alpha;
    ctx.fillStyle = this.color;
    ctx.beginPath();
    ctx.arc(this.x, this.y, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}
class ParticleEffect {
  particles: Particle[];
  x: number;
  y: number;
  color: string;

  constructor(x: number, y: number, drumHit: DrumSoundKey) {
    this.particles = [];
    this.x = x;
    this.y = y;
    this.color = this.getColorByDrumHit(drumHit);
    this.createParticles();
  }

  getColorByDrumHit(drumHit: DrumSoundKey) {
    switch (drumHit) {
      case "high_tom":
        return "rgba(255, 0, 0, 0.5)";
      case "snare":
        return "rgba(0, 255, 0, 0.5)";
      case "low_tom":
        return "rgba(0, 0, 255, 0.5)";
      case "high":
        return "rgba(255, 255, 0, 0.5)";
    }
  }

  createParticles() {
    for (let i = 0; i < 20; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3 + 1;
      const particle = new Particle(
        this.x,
        this.y,
        Math.cos(angle) * speed,
        Math.sin(angle) * speed,
        this.color
      );
      this.particles.push(particle);
    }
  }

  update(ctx: CanvasRenderingContext2D) {
    this.particles = this.particles.filter((particle) => {
      particle.update();
      particle.draw(ctx);
      return particle.alpha > 0;
    });
  }
}

const Mediapipe: React.FC = () => {
  const particleEffectsRef = useRef<ParticleEffect[]>([]);
  const webcamRef = useRef<Webcam>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const highTomRef = useRef<HTMLAudioElement>(null);
  const snareRef = useRef<HTMLAudioElement>(null);
  const lowTomRef = useRef<HTMLAudioElement>(null);
  const highRef = useRef<HTMLAudioElement>(null);
  const [audioURL] = useState<string>(
    `${window.backend_url}${window.music.music_file}`
  );
  const audioRef = useRef<HTMLAudioElement>(null);
  const [loaded, setLoaded] = useState<boolean>(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState<Blob[]>([]);
  const [drumRecording, setDrumRecording] = useState<
    {
      volume: number;
      velocity: number;
      drumHit: DrumSoundKey;
      hand: string;
      time: number;
    }[]
  >([]);
  const timestamp = useRef<number>(0);
  var prevIndexFingerY = [0, 0];

  var isInsideDrum = [false, false];

  useEffect(() => {});
  useEffect(() => {
    if (loaded) {
      console.log("加载成功");
    }
  }, [loaded]);
  const onResults = (results: Results) => {
    if (!webcamRef.current?.video || !canvasRef.current) return;

    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;
    canvasRef.current.width = videoWidth;
    canvasRef.current.height = videoHeight;

    const canvasElement = canvasRef.current;
    const canvasCtx = canvasElement.getContext("2d");
    if (canvasCtx == null) throw new Error("Could not get context");
    particleEffectsRef.current.forEach((effect) => {
      effect.update(canvasCtx);
    });
    canvasCtx.save();
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    canvasCtx.drawImage(
      results.image,
      0,
      0,
      canvasElement.width,
      canvasElement.height
    );
    // 在这里绘制粒子特效
    particleEffectsRef.current.forEach((effect) => {
      effect.update(canvasCtx);
    });

    // 清除虚拟鼓的区域
    canvasCtx.fillStyle = "rgba(0, 0, 0, 0.5)";
    canvasCtx.beginPath();
    canvasCtx.arc(
      HIGH_TOM_CENTER[0],
      HIGH_TOM_CENTER[1],
      RADIUS,
      0,
      Math.PI * 2
    );
    canvasCtx.arc(SNARE_CENTER[0], SNARE_CENTER[1], RADIUS, 0, Math.PI * 2);
    canvasCtx.arc(LOW_TOM_CENTER[0], LOW_TOM_CENTER[1], RADIUS, 0, Math.PI * 2);
    canvasCtx.arc(HIGH_CENTER[0], HIGH_CENTER[1], RADIUS, 0, Math.PI * 2);
    canvasCtx.fill();

    if (results.leftHandLandmarks) {
      const landmarks = results.leftHandLandmarks;
      const indexFingerTip = landmarks[8];
      const indexFingerDip = landmarks[5];
      const indexFingerX = indexFingerTip.x * canvasElement.width;
      const indexFingerY = indexFingerTip.y * canvasElement.height;
      const indexFingerDipX = indexFingerDip.x * canvasElement.width;
      const indexFingerDipY = indexFingerDip.y * canvasElement.height;

      drawDrumstick(
        canvasCtx,
        indexFingerDipX,
        indexFingerDipY,
        indexFingerX,
        indexFingerY
      );

      const drumHit = detectIndexFingerHit(
        indexFingerX,
        indexFingerY,
        0,
        prevIndexFingerY
      );
      if (drumHit) {
        console.log(isInsideDrum);
        if (!isInsideDrum[0] && indexFingerY > prevIndexFingerY[0]) {
          const velocity = calculateVelocity(indexFingerY, prevIndexFingerY[0]);
          const volume = mapVelocityToVolume(velocity);

          playDrumSound(drumHit, volume);
          console.log(Date.now(), timestamp);
          setDrumRecording((prevRecording) => [
            ...prevRecording,
            {
              volume,
              velocity,
              drumHit,
              hand: "left",
              time: Date.now() - timestamp.current,
            },
          ]);
          console.log(drumRecording);
          isInsideDrum[0] = true;
        }
      } else {
        isInsideDrum[0] = false;
      }

      prevIndexFingerY[0] = indexFingerY;
    }

    if (results.rightHandLandmarks) {
      const landmarks = results.rightHandLandmarks;
      const indexFingerTip = landmarks[8];
      const indexFingerDip = landmarks[5];
      const indexFingerX = indexFingerTip.x * canvasElement.width;
      const indexFingerY = indexFingerTip.y * canvasElement.height;
      const indexFingerDipX = indexFingerDip.x * canvasElement.width;
      const indexFingerDipY = indexFingerDip.y * canvasElement.height;

      drawDrumstick(
        canvasCtx,
        indexFingerDipX,
        indexFingerDipY,
        indexFingerX,
        indexFingerY
      );

      const drumHit = detectIndexFingerHit(
        indexFingerX,
        indexFingerY,
        1,
        prevIndexFingerY
      );
      if (drumHit) {
        if (!isInsideDrum[1] && indexFingerY > prevIndexFingerY[1]) {
          const velocity = calculateVelocity(indexFingerY, prevIndexFingerY[1]);
          const volume = mapVelocityToVolume(velocity);

          playDrumSound(drumHit, volume);
          setDrumRecording((prevRecording) => [
            ...prevRecording,
            {
              volume,
              velocity,
              drumHit,
              hand: "right",
              time: Date.now() - timestamp.current,
            },
          ]);
          isInsideDrum[1] = true;
        }
      } else {
        isInsideDrum[1] = false;
      }

      prevIndexFingerY[1] = indexFingerY;
    }

    drawDrums(canvasCtx);
    canvasCtx.restore();
  };
  useEffect(() => {
    const holistic = new Holistic({
      locateFile: (file: string) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/holistic/${file}`;
      },
    });

    holistic.setOptions({
      selfieMode: true,
      modelComplexity: 1,
      smoothLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    holistic.onResults(onResults);

    if (
      typeof webcamRef.current !== "undefined" &&
      webcamRef.current !== null
    ) {
      if (!webcamRef.current.video) return;
      const camera = new Camera(webcamRef.current.video, {
        onFrame: async () => {
          if (!webcamRef.current?.video) return;
          await holistic.send({ image: webcamRef.current.video });
          if (!loaded) setLoaded(true);
        },
        width: 720,
        height: 480,
      });
      camera.start();
    }
  }, []);
  const startRecording = () => {
    if (canvasRef.current) {
      const stream = canvasRef.current.captureStream();
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "video/webm",
      });

      mediaRecorder.addEventListener("dataavailable", handleDataAvailable);
      const start_time = Date.now();
      setDrumRecording([]);
      mediaRecorder.start();

      setIsRecording(true);
      mediaRecorderRef.current = mediaRecorder;
      timestamp.current = start_time;
    }
  };

  const stopRecording = () => {
    console.log(drumRecording);

    if (mediaRecorderRef.current) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      console.log(drumRecording);
      timestamp.current = 0;

      const audioFilename = window.music.title + "-" + window.music.artist;

      // 发送POST请求到服务器进行音频处理
      axios
        .post(window.backend_url + "process_audio/process_audio", {
          drum_hits: drumRecording,
          audio_filename: audioFilename,
        })
        .then((response) => {
          // 处理成功响应
          console.log("音频处理完成");
          console.log("输出文件URL:", response.data.file_url);
          const link = document.createElement("a");
          link.href = window.backend_url + response.data.file_url.slice(1);
          link.download = `${audioFilename}.wav`;
          link.style.display = "none";
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          // 在这里可以进行其他操作,例如播放合成后的音频
        })
        .catch((error) => {
          // 处理错误响应
          console.error("音频处理请求出错:", error);
        });
    }
  };

  const handleDataAvailable = (event: BlobEvent) => {
    if (event.data.size > 0) {
      setRecordedChunks((prevChunks) => [...prevChunks, event.data]);
    }
  };

  useEffect(() => {
    if (recordedChunks.length > 0 && !isRecording) {
      const blob = new Blob(recordedChunks, {
        type: "video/webm",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "recording.webm";
      a.click();
      URL.revokeObjectURL(url);
      setRecordedChunks([]);
    }
  }, [recordedChunks, isRecording]);

  const detectIndexFingerHit = (
    x: number,
    y: number,
    handId: number,
    prevIndexFingerY: number[]
  ): DrumSoundKey | null => {
    const HIT_THRESHOLD = 20;
    let drumHit: DrumSoundKey | null = null;

    if (y - prevIndexFingerY[handId] > HIT_THRESHOLD) {
      if (isInCircle(x, y, HIGH_TOM_CENTER, RADIUS)) {
        drumHit = "high_tom";
      } else if (isInCircle(x, y, SNARE_CENTER, RADIUS)) {
        drumHit = "snare";
      } else if (isInCircle(x, y, LOW_TOM_CENTER, RADIUS)) {
        drumHit = "low_tom";
      } else if (isInCircle(x, y, HIGH_CENTER, RADIUS)) {
        drumHit = "high";
      }
    }

    return drumHit;
  };
  const calculateVelocity = (currentY: number, prevY: number) => {
    return Math.abs(currentY - prevY);
  };

  const mapVelocityToVolume = (velocity: number) => {
    if (velocity < VELOCITY_THRESHOLD) {
      return MIN_VOLUME;
    } else {
      return Math.min(velocity / 100, MAX_VOLUME);
    }
  };
  const playDrumSound = (drumHit: DrumSoundKey, volume: number) => {
    console.log("播放");
    let x: number = 0,
      y: number = 0;
    switch (drumHit) {
      case "high_tom":
        if (highTomRef.current) {
          try {
            highTomRef.current.pause();
            highTomRef.current.volume = volume;
            highTomRef.current.currentTime = 0;

            highTomRef.current.play().catch((error) => {
              console.log("Error while playing high_tom:", error);
            });
            x = HIGH_TOM_CENTER[0];
            y = HIGH_TOM_CENTER[1];
          } catch (error) {}
        }
        break;
      case "snare":
        if (snareRef.current) {
          try {
            snareRef.current.pause();
            snareRef.current.volume = volume;
            snareRef.current.currentTime = 0;
            snareRef.current.play().catch((error) => {
              console.log("Error while playing high_tom:", error);
            });
            x = SNARE_CENTER[0];
            y = SNARE_CENTER[1];
          } catch (error) {}
        }
        break;
      case "low_tom":
        if (lowTomRef.current) {
          try {
            lowTomRef.current.pause();
            lowTomRef.current.volume = volume;
            lowTomRef.current.currentTime = 0;
            lowTomRef.current.play().catch((error) => {
              console.log("Error while playing high_tom:", error);
            });
            x = LOW_TOM_CENTER[0];
            y = LOW_TOM_CENTER[1];
          } catch (error) {}
        }
        break;
      case "high":
        if (highRef.current) {
          try {
            highRef.current.pause();
            highRef.current.volume = volume;
            highRef.current.currentTime = 0;
            highRef.current.play().catch((error) => {
              console.log("Error while playing high_tom:", error);
            });
            x = HIGH_CENTER[0];
            y = HIGH_CENTER[1];
          } catch (error) {}
        }
        break;
    }
    particleEffectsRef.current.push(new ParticleEffect(x, y, drumHit));
  };

  const handlePlayAudio = () => {
    if(isRecording) {
      handlePauseAudio()
      return;
    }
    if (audioRef.current) {
      audioRef.current.play();
      startRecording();
    }
  };

  const handlePauseAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      stopRecording();
    }
  };
  return (
    <div>
      {loaded || <div
        style={{
          position: "absolute",
          top: 0,
          bottom: 0,
          left: 0,
          right: 0,
          background: "white",
          textAlign: "center",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          zIndex: 9999,
        }}
      >
      <Spin tip="Loading..." size="large">
        <div className="content" style={{padding:50}} />
      </Spin>

      </div>}
      
      {/* <img
        src={"../img_genre/" + window.music.genre + ".png"}
        alt=""
        style={{
          objectFit: "contain",
          top:0,
          right:0,
          position: "absolute",
          bottom: 0,
          left: 0,
          filter:"blur(4px)",
          transform:"rotate()"
        }}
      /> */}
      <div style={{position:"absolute",top:0,
        right:0,
        left:0,
        bottom:0,
        display:"flex",
        alignItems:"center",
      }}>
      <img src="../speaker.svg" style={{ objectFit: "contain",width:180,height:360,position:"absolute",left:25,color:"red"}} />
      <img src="../speaker.svg" style={{ objectFit: "contain",width:180,height:360,position:"absolute",right:25}} />

      </div>

        <div>
        <Button
          type="primary"
          icon={(isRecording && <PauseCircleOutlined /> )|| <RightCircleOutlined />}
          style={{position:"absolute",right:12,bottom:12}}
          onClick={() => handlePlayAudio()}
          shape="circle"
          size="large"
        />
        {/* <button onClick={handlePlayAudio}>Play</button> */}
                  {/* <button onClick={handlePauseAudio}>Pause</button> */}
          <div className="App">
            <div style={{ width: "100%", textAlign: "center" }}>
              {audioURL && (
                <div>
                  <audio ref={audioRef} src={audioURL} />
                </div>
              )}
            </div>
            <div></div>

            <Webcam
              ref={webcamRef}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                right: 0,
                textAlign: "center",
                zIndex: 9,
                top:64,
                width: 840,
                height: 620,
              }}
            />

            <canvas
              ref={canvasRef}
              style={{
                position: "absolute",
                marginLeft: "auto",
                marginRight: "auto",
                left: 0,
                borderRadius: 16,
                right: 0,
                textAlign: "center",
                top:64,
                zIndex: 9,
                width: 840,
                height: 620,
                border: "solid 4px "+genre_colors[window.music.genre as keyof typeof genre_colors].color as keyof typeof String
              }}
            />

            <audio ref={highTomRef} src={highTomSound} />
            <audio ref={snareRef} src={snareSound} />
            <audio ref={lowTomRef} src={lowTomSound} />
            <audio ref={highRef} src={highSound} />
          </div>
        </div>
    </div>
  );
};

export default Mediapipe;
