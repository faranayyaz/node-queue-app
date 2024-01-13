const WebSocket = require("ws");

const createWebSocketServer = () => {
  const wss = new WebSocket.Server({ noServer: true });
  const clients = new Set();

  wss.on("connection", (ws) => {
    clients.add(ws);

    ws.on("close", () => {
      clients.delete(ws);
    });

    ws.on("message", (message) => {
      console.log(`Received: ${message}`);
    });
  });

  return {
    wss,
    broadcast: (data) => {
      const message = JSON.stringify(data);
      clients.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(message);
        }
      });
    },
  };
};

module.exports = createWebSocketServer;
