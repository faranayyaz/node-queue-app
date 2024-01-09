const express = require("express");
// eslint-disable-next-line new-cap
const router = express.Router();

const { transcribeLongAudio } = require("../controllers/transcribeController");
const { isAuthenticated } = require("../middlewares/authenticated");
const { processFileUpload } = require("../middlewares/upload");

// /api/v1/transcribe/longaudio
router.post(
  "/longaudio",
  isAuthenticated,
  processFileUpload,
  transcribeLongAudio
);

module.exports = router;
