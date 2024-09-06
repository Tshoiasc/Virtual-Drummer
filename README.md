# 🥁 Virtual Drummer by Yueqianji Chen

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Python](https://img.shields.io/badge/python-3.8%2B-brightgreen.svg)](https://www.python.org/)
[![Contributions Welcome](https://img.shields.io/badge/contributions-welcome-orange.svg)](CONTRIBUTING.md)

## 🎵 A Course Assessment for Computer Music

**Virtual Drummer** is an interactive web application that allows users to play virtual drums using hand gestures. It combines **computer vision techniques** with **real-time audio processing**, creating an immersive and expressive drumming experience.

![第4页-3](https://github.com/user-attachments/assets/85e64bb8-a7c6-4bb4-9f8f-e4a6f52f9b17)

![第5页-4](https://github.com/user-attachments/assets/f649c23f-e614-4613-9df3-ebc6c6a7f00d)



---

## ✨ Features

- 👋 **Hand gesture recognition** for virtual drumming
- 🎶 **Real-time audio processing** with drum sound triggering
- 🎵 **Music genre classification** using a pre-trained CNN model
- 🎛 **Audio equalization controls** for low, mid, and high frequencies
- 🔄 **WebSocket communication** between frontend and backend
- 🚀 **Low-latency hand tracking** using Mediapipe

---

## 🛠️ Technologies Used

- **React**: Frontend framework for building the user interface
- **Mediapipe**: Hand tracking and gesture recognition
- **OpenCV**: Computer vision library for image processing
- **WebSocket**: Real-time communication protocol between frontend and backend
- **Python**: Backend programming language
- **Librosa**: Audio feature extraction library
- **Keras**: Deep learning library for training the music genre classification model

---

## 🚀 Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/virtual-drummer.git


2. **Install the frontend dependencies**:
   ```bash
   cd virtual-drummer/Front-end
   npm install
   ```

3. **Install the backend dependencies**:
   ```bash
   cd ../backend
   pip install -r requirements.txt
   ```

4. **Set up the music genre classification model**:
   - Place your audio dataset in the `backend/wav` directory, organized by genre folders.
   - Run the `ModelConstruct.py` script to train the model:
     ```bash
     python ModelConstruct.py
     ```
   - The trained model will be saved as `model.h5`.

5. Start the backend server:
   ```bash
   python main.py
   ```

6. Start the frontend development server:
   ```bash
   cd ../Front-end
   npm start
   npm run electron-dev
   ```

7. Open your browser and navigate to `http://localhost:3000` to access the Virtual Drummer application.

## 🎮 Usage

1. Grant permission to access your webcam when prompted.
2. Use your hand gestures to play the virtual drums. The application will detect your hand movements and trigger corresponding drum sounds.
3. Adjust the audio equalization settings using the provided sliders to customize the sound.
4. Enjoy playing the virtual drums and exploring different rhythms and patterns!

## 📂 Folder Structure

📦 virtual-drummer
 ┣ 📂 Front-end_new/
 ┃ ┣ 📂 src/
 ┃ ┃ ┣ 📜 App.tsx       # Main application component
 ┃ ┃ ┣ 📜 index.js      # Entry point for frontend
 ┣ 📂 Back-end/
 ┃ ┣ 📜 main.py         # Backend server script
 ┃ ┣ 📜 camera_socket.py # WebSocket-based gesture recognition using OpenCV
 ┃ ┣ 📜 audio_processing.py # Audio processing APIs
 ┣ 📂 model_construct/
 ┃ ┣ 📜 ModelConstruct.py # Model training script for music genre classification
 ┃ ┣ 📂 wav/            # Directory for storing the audio dataset
 ┣ 📜 README.md         # Project overview


## 🙋🏻‍♀️ Acknowledgements

- [Mediapipe](https://mediapipe.dev/): For providing the hand tracking and gesture recognition capabilities.
- [Librosa](https://librosa.org/): For audio feature extraction and processing.
- [Keras](https://keras.io/): For building and training the music genre classification model.

## 💐 Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## 📚 License

This project is licensed under the [MIT License](LICENSE).
