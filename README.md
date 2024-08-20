# Node Queue App

## Overview

The Node Queue App is a task management system designed to handle background tasks efficiently. It uses bee-queue for task queuing, integrates Firebase for real-time updates, and supports WebSocket for live communication. Built with Express.js, this application offers a robust API and real-time capabilities for task processing.

## Features

- **Task Management:** Enqueue and process tasks using `bee-queue`.
- **Firebase Integration:** Real-time updates and authentication via Firebase.
- **WebSocket Support:** Real-time notifications and updates through WebSocket.
- **File Upload Handling:** Middleware for processing file uploads.
- **Secure API:** Authentication for accessing sensitive endpoints.

## Installation

1. **Clone the Repository:**
    ```bash
    git clone <repository-url>
    cd queue-app
    ```

2. **Install Dependencies:**
    ```bash
    npm install
    ```

3. **Firebase Setup:**
    - Ensure Firebase is configured in `firebase.json` and `.firebaserc`.
    - Add Firebase credentials to your environment or configuration files.

4. **Start the Application:**
    ```bash
    npm start
    ```

## API Endpoints

- **Task Routes (`/api/tasks`):**
  - **`POST /enqueue`**: Enqueue a new task. Authentication is optional (currently commented out).

- **Transcription Routes (`/api/v1/transcribe`):**
  - **`POST /longaudio`**: Transcribe long audio files. Authentication is required.

## Middleware

- **`authenticated.js`**: Middleware to ensure the user is authenticated.
- **`upload.js`**: Middleware for handling file uploads.

## WebSocket

- The WebSocket server is set up in `utils/websocket.js` to provide real-time updates on task processing.

## Configuration

- **Port:** The server defaults to port `3000`. Modify `server.js` to change this.
- **Firebase:** Ensure your Firebase project configuration is correct in `firebase.json` and `.firebaserc`.

## Contributing

Contributions are welcome! To contribute:

1. Fork the repository.
2. Create a new branch (`git checkout -b feature/your-feature`).
3. Commit your changes (`git commit -am 'Add new feature'`).
4. Push to your branch (`git push origin feature/your-feature`).
5. Open a Pull Request.

## Contact

For questions or support, please contact [Muhammad Faran Ayyaz](mailto:faraan.dev@gmail.com).

---

Feel free to adjust or add any specific details or instructions based on your project's needs!
