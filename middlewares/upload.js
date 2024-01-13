const formidable = require("formidable");

const createWebSocketServer = require("../utils/websocket");

const { wss, broadcast } = createWebSocketServer();

// Middleware for processing file uploads
const processFileUpload = (req, res, next) => {
  const form = new formidable.IncomingForm();
  let body;
  let uploadedFile;
  // form.onPart = (part) => {
  // if (!part.filename) {
  // form.handlePart(part);
  // console.log(JSON.stringify(part, null, 2));
  // }

  // console.log(`Received file: ${part.filename}`);
  // uploadedFile = part;
  // };

  const fileProgress = {
    total: req.headers["content-length"],
    uploaded: 0,
  };

  // Stream progress updates during file upload
  req.on("data", (chunk) => {
    fileProgress.uploaded += chunk.length;

    // Broadcast progress to connected clients
    broadcast({ progress: "File upload progress", data: fileProgress });
  });

  form.parse(req, (err, fields, files) => {
    console.log(JSON.stringify(fields, null, 2));
    body = fields;
    req.body = body;
  });

  form.on("file", (name, file) => {
    console.log(`Received file: ${name}`);
    uploadedFile = file;
    req.file = uploadedFile;
  });

  form.on("end", () => {
    console.log("File upload complete");
    next();
  });

  form.on("error", (err) => {
    console.error("File upload error:", err);
    res.status(500).json({ error: "File upload failed" });
  });

  // Call next middleware or route handler once the file is fully uploaded
  req.on("end", () => {
    next();
  });
};

module.exports = {
  processFileUpload,
};
