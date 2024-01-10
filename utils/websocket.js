const WebSocket = require("ws");

const createWebSocketServer = (server) => {
  const wss = new WebSocket.Server({ server });

  wss.on("connection", (ws) => {
    ws.on("message", (message) => {
      console.log(`Received: ${message}`);
    });
  });

  return wss;
};

module.exports = createWebSocketServer;
