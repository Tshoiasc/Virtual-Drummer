import React, { useEffect, useRef, useState } from "react";
import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import MediaPipe from "./mediapipe"; // 导入 MediaPipe 组件
import { RightOutlined } from "@ant-design/icons";
import {
  Button,
  Input,
  Typography,
  Card,
  Avatar,
  Row,
  Col,
  Layout,
  Select,
} from "antd";
import { country_list } from "./const_data";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
const { Meta } = Card;
const { Title, Paragraph } = Typography;
const pageVariants = {
  initial: { opacity: 0, x: "100%" },
  in: { opacity: 1, x: 0 },
  out: { opacity: 0, x: "-100%" },
};
const { Option } = Select;

const drumBeats = [6000, 12000, 18000, 24000, 30000, 36000, 42000, 48000];
const pageTransition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.5,
};

const NameInputPage = () => {
  const [name, setName] = useState("");
  const [country, setCountry] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleInputChange = (event: {
    target: { value: React.SetStateAction<string> };
  }) => {
    setName(event.target.value);
  };

  const handleCountryChange = (value: string) => {
    setCountry(value);
  };

  const handleSubmit = () => {
    setLoading(true);
    // 在这里可以处理表单提交的逻辑,例如发送请求或存储数据
    console.log("Submitted name:", name);
    console.log("Selected country:", country);
    // 模拟请求延迟
    setTimeout(() => {
      setLoading(false);
      window.name = name;
      navigate("/music");
    }, 500);
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          height: "100vh",
        }}
      >
        <div style={{ textAlign: "center", marginBottom: 24 }}>
          <Title level={2}>Virtual Drummer</Title>
          <Paragraph>
            Welcome to Virtual Drummer, an online drummer application based on
            OpenCV.
            <br />
            Here you can enjoy the fun of beating drums and let's explore the
            mystery of music together!
          </Paragraph>
        </div>
        <Input
          value={name}
          onChange={handleInputChange}
          placeholder="Please input your name..."
          style={{
            width: 360,
            height: 48,
            fontSize: 18,
            borderWidth: 2,
            marginBottom: 24,
          }}
          onFocus={(event) => {
            event.target.style.borderColor = "blue";
          }}
          onBlur={(event) => {
            event.target.style.borderColor = "";
          }}
        />
        <Select
          showSearch
          placeholder="Select your country"
          optionFilterProp="children"
          onChange={handleCountryChange}
          filterOption={(input, option) =>
            (option!.children?.[1] as unknown as string)
              .toLowerCase()
              .includes(input.toLowerCase())
          }
          style={{ width: 360, marginBottom: 24 }}
        >
          {country_list.map((country) => (
            <Option key={country.code} value={country.name}>
              <img
                src={`https://flagcdn.com/16x12/${country.code.toLowerCase()}.png`}
                srcSet={`https://flagcdn.com/32x24/${country.code.toLowerCase()}.png 2x,
                  https://flagcdn.com/48x36/${country.code.toLowerCase()}.png 3x`}
                width="16"
                height="12"
                alt={`Flag of ${country.name}`}
                style={{ marginRight: 8 }}
              />
              {country.name}
            </Option>
          ))}
        </Select>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={loading}
          style={{ width: 200, height: 42, fontSize: 16, marginTop: 12 }}
        >
          {loading ? "Loading..." : "Start"}
        </Button>
      </div>
    </motion.div>
  );
};

// 定义About组件
const MusicPage = () => {
  const [loading, setLoading] = useState(true);
  const [selectedCard, setSelectedCard] = useState<number>(-1);
  const [predictCard, setPredictCard] = useState<number>(-1);
  const [musicList, setMusicList] = useState<any[]>([]);
  const [buttonLoading, setButtonLoading] = useState(false);

  useEffect(() => {
    const fetchMusicList = async () => {
      console.log(window.backend_url + "process_audio/songs");
      try {
        const response = await fetch(
          window.backend_url + "process_audio/songs"
        );
        const data = await response.json();
        console.log(data);

        setMusicList(data);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching music list:", error);
        setLoading(false);
      }
    };

    fetchMusicList();
  }, []);
  setTimeout(() => {
    setLoading(false);
  }, 50);
  const navigate = useNavigate();
  const analyzeMusic = async function () {
    const response = await axios(
      `http://localhost:8000/analyze?filename=${musicList[selectedCard].filename}`
    );
    return {
      ...musicList[selectedCard],
      ...response.data,
    };
  };
  const handleClick = async () => {
    setButtonLoading(true);
    setTimeout(async () => {
      // 跳转到下一个页面的逻辑
      let data = await analyzeMusic();
      console.log(data);
      window.music = data;
      setButtonLoading(false);
      navigate("/music_setting");
    });
  };

  const handleCardClick = (cardId: number) => {
    console.log(cardId);
    setSelectedCard(cardId);
    // message.success(`你选择了音乐卡片 ${cardId}`);
  };
  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div style={{ padding: "24px" }}>
        <Title level={2}>Welcome, {window.name}!</Title>
        <Title level={3}>Music Library</Title>
        <Row gutter={[24, 24]} justify="start" style={{ marginTop: 24 }}>
          {musicList.map((music, cardId) => (
            <Col key={cardId}>
              <Card
                style={{
                  width: 320,
                  cursor: "pointer",
                  boxSizing: "border-box",
                  border:
                    selectedCard === cardId
                      ? "2px solid #3875F688"
                      : predictCard === cardId
                      ? "1px solid #3875F655"
                      : "",
                }}
                loading={loading}
                onMouseEnter={() => {
                  setPredictCard(cardId);
                }}
                onMouseLeave={() => {
                  setPredictCard(-1);
                }}
                onClick={() => handleCardClick(cardId)}
              >
                <Meta
                  avatar={
                    <Avatar
                      src={
                        music.cover_file
                          ? window.backend_url + music.cover_file
                          : `https://api.dicebear.com/7.x/miniavs/svg?seed=${cardId}:`
                      }
                      shape="square"
                      size={52}
                    />
                  }
                  title={`${music.title}`}
                  description={`artist ${music.artist}`}
                />
              </Card>
            </Col>
          ))}
        </Row>
        <div style={{ marginTop: "24px" }}>
          <Paragraph>
            This is the music library page, where you can browse and select
            different music. Each music card displays the music's title and
            author information. Hover the mouse over the card to preview it, and
            click on the card to select the corresponding music.
          </Paragraph>
          <Paragraph>
            We welcome you,{window.name}! I hope you can find your favorite
            music here and enjoy the charm of music!
          </Paragraph>
        </div>
        <div style={{ position: "fixed", bottom: 20, right: 20 }}>
          <Button
            type="primary"
            icon={<RightOutlined />}
            loading={buttonLoading}
            onClick={handleClick}
            shape="circle"
            size="large"
            disabled={selectedCard === -1}
          ></Button>
        </div>
      </div>
    </motion.div>
  );
};

interface Lyric {
  time: number;
  text: string;
}

interface LyricsDisplayProps {
  lyrics: Lyric[];
  drumBeats: number[];
  currentTime: number;
}
const LyricsDisplay: React.FC<LyricsDisplayProps> = ({
  lyrics,
  drumBeats,
  currentTime,
}) => {
  const [currentLyricIndex, setCurrentLyricIndex] = useState<number>(0);
  const lyricsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 根据当前播放时间查找对应的歌词行索引
    const index = lyrics.findIndex((lyric) => lyric.time > currentTime * 1000);
    setCurrentLyricIndex(index === -1 ? lyrics.length - 1 : index - 1);
  }, [currentTime, lyrics]);

  useEffect(() => {
    // 滚动歌词到可视区域中央
    if (lyricsRef.current) {
      const currentElement = lyricsRef.current.children[currentLyricIndex];
      if (currentElement) {
        currentElement.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }
  }, [currentLyricIndex]);
  return (
    <div ref={lyricsRef} style={{ maxHeight: "300px", overflowY: "scroll"}}>
      {lyrics.map((lyric, index) => (
        <Paragraph
          key={index}
          style={{
            color: index === currentLyricIndex ? "#1890ff" : "inherit",
            fontWeight: index === currentLyricIndex ? "bolder" : "normal",
            fontSize: index === currentLyricIndex ? 20 : 16,
          }}
        >
          {/* {drumBeats.includes(lyric.time) && (
            <span style={{ color: "red", marginRight: "4px" }}>🥁</span>
          )} */}
          {lyric.text}
        </Paragraph>
      ))}
    </div>
  );
};

const MusicSetting: React.FC = () => {
  const audioSrc = `${window.backend_url}${window.music.music_file}`;
  const [currentTime, setCurrentTime] = useState<number>(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const navigate = useNavigate();
  const suggestionOutput = useRef<HTMLDivElement>(null);
  const [hasUsed,setHasUsed] = useState<boolean>(false)
  const [started,setStarted] = useState<boolean>(false)


  useEffect(() => {
    let isMounted = true;

    const generateDrumSuggestion = async function () {
      console.log("触发了");
      if (hasUsed) return;

      const question = `给定一段音乐,它的特征如下:
      - 流派: ${window.music.genre}
      - 节奏: ${window.music.tempo} BPM
      - 音高范围: ${Math.min(window.music.pitch)} - ${Math.max(
        window.music.pitch
      )}
      - 歌词: ${JSON.stringify(window.music.lyrics)}...
  
      请为这段音乐提供一个适合的鼓点编排方案。你的建议应该包括:
      1. 鼓点风格与音乐风格的匹配程度 
      3. 鼓点节奏型的设计,可以用鼓谱或文字描述
      4. 鼓点密度与音乐情绪的匹配
      5. 结合歌词内容,讨论鼓点在不同歌曲部分(如主歌、副歌)的变化
      6. 其他任何你认为重要的考虑因素
      除了以上六条不要回复任何其他的话
      please reply in english
      `;

      try {
        const response = await fetch(
          `http://localhost:8000/generate_gpt_suggestion?prompt=${question}`
        );
        if (response.body && isMounted) {
          const reader = response.body.getReader();
          const decoder = new TextDecoder();

          while (true) {
            const { done, value } = await reader.read();
            if (done) break;
            const decodedValue = decoder.decode(value);
            if(!started)setStarted(true)
            if (suggestionOutput.current) {
              
              suggestionOutput.current.innerHTML += decodedValue;
            }
          }

          setHasUsed(true);
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    generateDrumSuggestion();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    // 监听音频的 timeupdate 事件
    const handleTimeUpdate = () => {
      if (audioRef.current) {
        console.log(audioRef.current.currentTime);
        setCurrentTime(audioRef.current.currentTime);
      }
    };



    if (audioRef.current) {
      audioRef.current.addEventListener("timeupdate", handleTimeUpdate);
    }
   
    // 清理事件监听
    return () => {
      if (audioRef.current) {
        // eslint-disable-next-line react-hooks/exhaustive-deps
        audioRef.current.removeEventListener("timeupdate", handleTimeUpdate);
      }
    };
  }, []);

  const handleClick = () => {
    navigate("/mediapipe");
  };

  return (
    <motion.div
      initial="initial"
      animate="in"
      exit="out"
      variants={pageVariants}
      transition={pageTransition}
    >
      <div
        style={{
          padding: "90px 60px 0 60px",
          display: "flex",
          justifyContent: "space-between",
        }}
      >
        <div>
          <Card
            hoverable
            style={{ width: 340, margin: "auto 0" }}
            cover={
              <img
                alt="example"
                src={window.backend_url + window.music.cover_file}
              />
            }
          >
            <Meta
              title={window.music.title}
              description={window.music.artist}
            />
            <audio
              ref={audioRef}
              src={audioSrc}
              controls
              style={{ width: "100%", marginTop: 32 }}
            ></audio>
          </Card>
        </div>

        <div>
          <div style={{ display: "flex" }}>
            <div
              style={{
                backgroundColor: "#f8f8f8",
                width: "520px",
                height: "300px",
                textAlign: "center",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: 42,
                color: "#888",
                overflow: "hidden",
                borderRadius: 6,
                padding:24
              }}
            >
              <LyricsDisplay
                lyrics={window.music.lyrics}
                drumBeats={drumBeats}
                currentTime={currentTime}
              />
            </div>

            <div
              style={{
                width: "175px",
                textAlign: "center",
                display: "flex",
                justifyContent: "space-between",
                color: "#888",
                marginLeft: 24,
                flexDirection: "column",
                padding: "24px 2px",
                backgroundColor: "#f8f8f8",
              }}
            >
              <div style={{ fontWeight: "bold" }}>mean of pitch</div>
              <div>
                {(
                  window.music.pitch.reduce(
                    (accumulator: any, currentValue: any) => {
                      return accumulator + currentValue;
                    },
                    0
                  ) / window.music.pitch.length
                ).toFixed(2)}
              </div>

              <div style={{ fontWeight: "bold" }}>max of pitch</div>
              <div>{Math.max(...window.music.pitch).toFixed(2)}</div>
              <div style={{ fontWeight: "bold" }}>min of pitch</div>
              <div>{Math.min(...window.music.pitch).toFixed(2)}</div>

              <div style={{ fontWeight: "bold" }}>tempo</div>
              <div>{window.music.tempo}</div>
              <div style={{ fontWeight: "bold" }}>genre</div>
              <div>{window.music.genre}</div>
            </div>
          </div>
          <div
            ref={suggestionOutput}
            style={{
              backgroundColor: "#f6f6f6",
              width: "720px",
              height: "150px",
              fontSize: 14,
              color: "#888",
              marginTop: 24,
              borderRadius: 6,
              padding: 24,
              overflow:"auto",
              
            }}
            
          >
            {!started?'GPT points Loading' : ''}
          </div>
        </div>
        <div style={{ position: "fixed", bottom: 20, right: 20 }}>
          <Button
            type="primary"
            icon={<RightOutlined />}
            onClick={handleClick}
            shape="circle"
            size="large"
          ></Button>
        </div>
      </div>
    </motion.div>
  );
};

const App: React.FC = () => {
  return (
    <Router>
      <AnimatePresence mode="wait">
        <Routes>
          <Route path="/" element={<NameInputPage />} />
          <Route path="/music" element={<MusicPage />} />
          <Route path="/mediapipe" element={<MediaPipe />} />
          <Route path="/music_setting" element={<MusicSetting />} />
        </Routes>
      </AnimatePresence>
    </Router>
  );
};

export default App;
