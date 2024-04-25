import React, { useRef, useEffect, useState } from "react";
import axios from 'axios';
import highTomSound from './soundEffect/highShort.wav';
import snareSound from './soundEffect/snareShort.wav';
import lowTomSound from './soundEffect/lowSnare.wav';
import highSound from './soundEffect/smash.wav';
const FrequencyControl = () => {
  const audioRef = useRef(null);
  const highTomRef = useRef(null);
  const snareRef = useRef(null);
  const lowTomRef = useRef(null);
  const highRef = useRef(null);
  const audioContextRef = useRef(null);
  const sourceRef = useRef(null);
  const lowFilterRef = useRef(null);
  const midFilterRef = useRef(null);
  const highFilterRef = useRef(null);
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const socketRef = useRef(null);
  const [lowGain, setLowGain] = useState(0);
  const [midGain, setMidGain] = useState(0);
  const [highGain, setHighGain] = useState(0);
  const [audioContextStarted, setAudioContextStarted] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [username, setUserName] = useState("");
  const handleInputChange = (event) => {
    setInputValue(event.target.value);
  };
  const startLinkWebsocket = (url)=>{
     // 调用用户摄像头
     navigator.mediaDevices.getUserMedia({ video: true }).then((stream) => {
      videoRef.current.srcObject = stream;
      videoRef.current.play();

      // 建立WebSocket连接
      socketRef.current = new WebSocket("ws://localhost:8000"+url);

      // 定时发送帧数据给后端
      const intervalId = setInterval(() => {
        const canvas = document.createElement("canvas");
        canvas.width = videoRef.current.videoWidth;
        canvas.height = videoRef.current.videoHeight;
        canvas
          .getContext("2d")
          .drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        canvas.toBlob(
          (blob) => {
            const reader = new FileReader();
            reader.onload = () => {
              const base64 = reader.result.split(",")[1];
              socketRef.current.send(JSON.stringify({ frame: base64 }));
            };
            reader.readAsDataURL(blob);

          },
          "image/jpeg",
          0.8
        );
      }, 100);
      // 处理WebSocket消息
      socketRef.current.onmessage = (event) => {

        const message = JSON.parse(event.data);
        // console.log(message)

        if (message.action === 'play_drum') {
          // 根据鼓的类型播放相应的音频
          switch (message.drum_type) {
            case 'high_tom':
              highTomRef.current.currentTime = 0;
              highTomRef.current.play();
              break;
            case 'snare':
              snareRef.current.currentTime = 0;
              snareRef.current.play();
              break;
            case 'low_tom':
              lowTomRef.current.currentTime = 0;
              lowTomRef.current.play();
              break;
            case 'high':
              highRef.current.currentTime = 0;
              highRef.current.play();
              break;
            default:
              break;
          }
        } else if (message.action === 'frame') {

          const image = new Image();
          image.onload = () => {
            
            const canvas = canvasRef.current;
            const context = canvas.getContext('2d');
            context.clearRect(0, 0, canvas.width, canvas.height);
            context.drawImage(image, 0, 0, canvas.width, canvas.height);
          };
          image.src = `data:image/jpeg;base64,${message.frame}`;
        }
      };

      // 清理函数
      return () => {
        clearInterval(intervalId);
        socketRef.current.close();
      };
    });
  }
  const handleButtonClick = async () => {
    console.log(`Stored value: ${inputValue}`);
    setUserName(inputValue);
    try {
      let requestData = {
        username:inputValue
      }; // 直接将inputValue作为请求体
      const response = await axios.post('http://localhost:8000/create_websocket', requestData, {
        headers: {
          'Content-Type': 'application/json'
        }
      });
      // setData(response.data);
      console.log('POST request successful:', response.data);
      let websocket_url = response.data.websocket_url
      startLinkWebsocket(websocket_url)
    } catch (error) {
      console.error('Error:', error);
    }

  };

  const canvasStyle = {
    width: "840px",
    height: "540px",
    border: "1px solid black",
  };

  useEffect(() => {
    audioContextRef.current = new AudioContext();
    sourceRef.current = audioContextRef.current.createMediaElementSource(
      audioRef.current
    );
    lowFilterRef.current = audioContextRef.current.createBiquadFilter();
    lowFilterRef.current.type = "lowshelf";
    lowFilterRef.current.frequency.value = 500;
    midFilterRef.current = audioContextRef.current.createBiquadFilter();
    midFilterRef.current.type = "peaking";
    midFilterRef.current.frequency.value = 1500;
    midFilterRef.current.Q.value = 1;
    highFilterRef.current = audioContextRef.current.createBiquadFilter();
    highFilterRef.current.type = "highshelf";
    highFilterRef.current.frequency.value = 2000;
    sourceRef.current.connect(lowFilterRef.current);
    lowFilterRef.current.connect(midFilterRef.current);
    midFilterRef.current.connect(highFilterRef.current);
    highFilterRef.current.connect(audioContextRef.current.destination);
  }, []);

  useEffect(() => {
    lowFilterRef.current.gain.value = lowGain;
  }, [lowGain]);

  useEffect(() => {
    midFilterRef.current.gain.value = midGain;
  }, [midGain]);

  useEffect(() => {
    highFilterRef.current.gain.value = highGain;
  }, [highGain]);


  const startAudioContext = () => {
    if (!audioContextStarted) {
      audioContextRef.current.resume().then(() => {
        setAudioContextStarted(true);
      });
    }
  };

  const handleFileUpload = (event) => {
    const file = event.target.files[0];
    const url = URL.createObjectURL(file);
    audioRef.current.src = url;
    audioRef.current.load();
    startAudioContext();
  };


  return (
    <div>
      <input type="file" accept="audio/*" onChange={handleFileUpload} />
      <audio ref={audioRef} controls></audio>
      <audio ref={highTomRef} src={highTomSound} />
      <audio ref={snareRef} src={snareSound} />
      <audio ref={lowTomRef} src={lowTomSound} />
      <audio ref={highRef} src={highSound} />
      <video ref={videoRef} style={{ display: "none" }}></video>
      <canvas ref={canvasRef} style={canvasStyle}></canvas>
      <div>
        <label htmlFor="lowFreqSlider">低频 (20-500 Hz):</label>
        <input
          type="range"
          id="lowFreqSlider"
          min="-10"
          max="10"
          step="0.1"
          value={lowGain}
          onChange={(e) => setLowGain(parseFloat(e.target.value))}
        />
      </div>
      <div>
        <label htmlFor="midFreqSlider">中频 (500-2000 Hz):</label>
        <input
          type="range"
          id="midFreqSlider"
          min="-10"
          max="10"
          step="0.1"
          value={midGain}
          onChange={(e) => setMidGain(parseFloat(e.target.value))}
        />
      </div>
      <div>
        <label htmlFor="highFreqSlider">高频 (2000-20000 Hz):</label>
        <input
          type="range"
          id="highFreqSlider"
          min="-10"
          max="10"
          step="0.1"
          value={highGain}
          onChange={(e) => setHighGain(parseFloat(e.target.value))}
        />
      </div>
      <input
        type="text"
        value={inputValue}
        onChange={handleInputChange}
        placeholder="Enter your text..."
      />
      <button onClick={handleButtonClick}>Store Value</button>
    </div>
  );
};

export default FrequencyControl;
