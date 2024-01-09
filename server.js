// server.js

const functions = require("firebase-functions");
const admin = require("firebase-admin");
const express = require("express");
const formidable = require("formidable");
const cors = require("cors");
const WebSocket = require("ws");
const Queue = require("bee-queue");
const { isAuthenticated } = require("./middlewares/authenticated");
const { processFileUpload } = require("./middlewares/upload");

// Initialize Firebase Admin SDK
admin.initializeApp();

const app = express();
const port = 3000;

app.use(cors());

// Create a WebSocket server
const wss = new WebSocket.Server({ noServer: true });

// Create a queue named 'tasks'
const queue = new Queue("tasks");

// WebSocket connections
wss.on("connection", (ws) => {
  ws.on("message", (message) => {
    console.log(`Received: ${message}`);
  });
});

// Handle upgrade request for WebSocket
const handleWebSocketUpgrade = (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, (ws) => {
    wss.emit("connection", ws, request);
  });
};

app.server = app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});

app.server.on("upgrade", handleWebSocketUpgrade);

// API endpoint to enqueue requests
app.post("/enqueue", isAuthenticated, processFileUpload, async (req, res) => {
  const taskData = { fields: req.body, files: req.file };

  try {
    // Enqueue the task
    await queue.createJob(taskData).save();
    res.status(202).json({ message: "Task enqueued successfully" });
  } catch (error) {
    console.error("Error enqueuing task:", error);
    res.status(500).json({ error: "Error enqueuing task" });
  }
});

// Function to process tasks from the queue
const processQueue = async () => {
  const job = await queue.getJob();

  if (job) {
    const taskData = job.data;

    try {
      // Log task data to identify the source of undefined values
      console.log("Task data:", taskData);

      // Process the task (replace this with your actual processing logic)
      await processTask(taskData);

      // Remove the processed job from the queue
      await job.remove();

      // Continue processing the next task in the queue
      processQueue();
    } catch (error) {
      console.error("Error processing task:", error);

      // Continue processing the next task in the queue even if there's an error
      processQueue();
    }
  } else {
    // No more tasks in the queue
    console.log("Queue is empty");
  }
};

// Function to simulate processing time (replace with your actual processing logic)
const processTask = async (taskData) => {
  console.log("Processing task:", taskData);
  await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulated processing time of 5 seconds
  console.log("Task processed successfully");
};

// Start processing tasks from the queue
processQueue();

// Add your other routes and middleware here...

// Handle file upload progress
app.post("/progress", (req, res) => {
  // Send real-time updates to connected WebSocket clients
  wss.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send("File upload progress: " + req.body.progress);
    }
  });

  res.status(200).json({ message: "Progress updated successfully" });
});
