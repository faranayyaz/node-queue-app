const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const cors = require("cors");
const http = require("http");
const taskHelper = require("./helpers/taskHelper");
const createWebSocketServer = require("./utils/websocket");
const taskRoutes = require("./routes/taskRoute");

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();
const port = 3000;

app.use(cors());

// Create an HTTP server
const server = http.createServer(app);

// Use WebSocket module to create a WebSocket server
const wss = createWebSocketServer();

// Use the taskRoutes module for API endpoints
app.use("/api/tasks", taskRoutes);

const startServer = () => {
  console.log("Starting server...");
  server.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
};

// Start the server
startServer();
taskHelper.processQueue();
