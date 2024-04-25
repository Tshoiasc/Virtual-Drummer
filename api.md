# Backend API Documentation

This document provides an overview of the backend API endpoints available in the Virtual Drummer application.

## Base URL

The base URL for all API endpoints is: `http://localhost:8000`

## Endpoints

### 1. Create WebSocket

- **URL**: `/create_websocket`
- **Method**: POST
- **Description**: Creates a new WebSocket connection for a user.
- **Request Body**:
  ```json
  {
    "username": "string"
  }
  ```
- **Response**:
  - **Status Code**: 200 OK
  - **Body**:
    ```json
    {
      "websocket_url": "string"
    }
    ```

### 2. Process Audio

- **URL**: `/process_audio`
- **Method**: POST
- **Description**: Processes the audio data and applies the selected drum sound effect.
- **Request Body**:
  ```json
  {
    "audio_data": "string",
    "drum_type": "string"
  }
  ```
- **Response**:
  - **Status Code**: 200 OK
  - **Body**:
    ```json
    {
      "processed_audio": "string"
    }
    ```

### 3. Get Songs

- **URL**: `/songs`
- **Method**: GET
- **Description**: Retrieves the list of available songs.
- **Response**:
  - **Status Code**: 200 OK
  - **Body**:
    ```json
    [
      {
        "id": "string",
        "title": "string",
        "artist": "string",
        "genre": "string",
        "file_path": "string"
      }
    ]
    ```

### 4. Analyze Music

- **URL**: `/analyze`
- **Method**: POST
- **Description**: Analyzes the music file and returns the predicted genre and other audio features.
- **Request Body**:
  ```json
  {
    "file_path": "string"
  }
  ```
- **Response**:
  - **Status Code**: 200 OK
  - **Body**:
    ```json
    {
      "genre": "string",
      "tempo": "number",
      "pitch": "number"
    }
    ```

### 5. Generate GPT Suggestion

- **URL**: `/generate_gpt_suggestion`
- **Method**: GET
- **Description**: Generates a drumming suggestion based on the provided music features using GPT.
- **Query Parameters**:
  - `genre`: string
  - `tempo`: number
  - `pitch`: number
- **Response**:
  - **Status Code**: 200 OK
  - **Body**: Text stream of the generated suggestion.

## Error Responses

- **Status Code**: 400 Bad Request
  - **Body**:
    ```json
    {
      "error": "string"
    }
    ```

- **Status Code**: 404 Not Found
  - **Body**:
    ```json
    {
      "error": "string"
    }
    ```

- **Status Code**: 500 Internal Server Error
  - **Body**:
    ```json
    {
      "error": "string"
    }
    ```

请将此API文档添加到项目的描述文件中,以便开发人员和用户可以轻松参考后端API的详细信息。这将有助于理解后端提供的功能以及如何与之交互。

如果你还有任何其他需要添加或修改的内容,请告诉我,我很乐意进一步完善文档。
