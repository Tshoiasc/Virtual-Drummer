# Virtual Drummer by Yueqianji Chen
An course assessment for Computer music 
Virtual Drummer is an interactive web application that allows users to play virtual drums using hand gestures. It leverages computer vision techniques and real-time audio processing to create an immersive drumming experience.


![image](https://github.com/Tshoiasc/Visual-Drummer/assets/30382941/a1258bca-0eba-4143-a8e0-3cb7556623d8)


## Features

- Hand gesture recognition for playing virtual drums
- Real-time audio processing and drum sound triggering
- Music genre classification using a pre-trained CNN model
- Audio equalization controls for low, mid, and high frequencies
- WebSocket communication between frontend and backend for seamless interaction
- Integration with Mediapipe for low-latency hand tracking

## Technologies Used

- React: Frontend framework for building the user interface
- Mediapipe: Library for hand tracking and gesture recognition
- OpenCV: Computer vision library for image processing
- WebSocket: Protocol for real-time communication between frontend and backend
- Python: Backend programming language
- Librosa: Library for audio feature extraction
- Keras: Deep learning library for building and training the music genre classification model

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/your-username/virtual-drummer.git
   ```

2. Install the frontend dependencies:
   ```
   cd virtual-drummer/Front-end
   npm install
   ```

3. Install the backend dependencies:
   ```
   cd ../backend
   pip install -r requirements.txt
   ```

4. Set up the music genre classification model:
   - Place your audio dataset in the `backend/wav` directory, organized by genre folders.
   - Run the `ModelConstruct.py` script to train the model:
     ```
     python ModelConstruct.py
     ```
   - The trained model will be saved as `model.h5`.

5. Start the backend server:
   ```
   python main.py
   ```

6. Start the frontend development server:
   ```
   cd ../Front-end
   npm start
   npm run electron-dev
   ```

7. Open your browser and navigate to `http://localhost:3000` to access the Virtual Drummer application.

## Usage

1. Grant permission to access your webcam when prompted.
2. Use your hand gestures to play the virtual drums. The application will detect your hand movements and trigger corresponding drum sounds.
3. Adjust the audio equalization settings using the provided sliders to customize the sound.
4. Enjoy playing the virtual drums and exploring different rhythms and patterns!

## Folder Structure

- `Front-end_new/`: Contains the React frontend code.
  - `src/`: Source code files.
    - `App.tsx`: Main application component.
    - `index.js`: Entry point of the frontend application.
- `Back-end/`: Contains the Python backend code.
  - `main.py`: Backend server script.
  - `camera_socket.py`: use websocket connect to front-end and use opencv-python to do gesture recognition
  - `audio_processing.py` some api about audio adress
- `model_construct`:
  - `ModelConstruct.py`: Script for training the music genre classification model.
  - `wav/`: Directory for storing the audio dataset.
- `README.md`: Readme file providing an overview of the project.

## Acknowledgements

- [Mediapipe](https://mediapipe.dev/): For providing the hand tracking and gesture recognition capabilities.
- [Librosa](https://librosa.org/): For audio feature extraction and processing.
- [Keras](https://keras.io/): For building and training the music genre classification model.

## Contributing

Contributions are welcome! If you have any ideas, suggestions, or bug reports, please open an issue or submit a pull request.

## License

This project is licensed under the [MIT License](LICENSE).
