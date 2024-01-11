const express = require("express");
const router = express.Router();
const { processFileUpload } = require("../middlewares/upload");
const { isAuthenticated } = require("../middlewares/authenticated");
const taskController = require("../controllers/taskController");

// API endpoint to enqueue requests
// router.post("/enqueue", isAuthenticated, processFileUpload, taskController.enqueueTask); // use this one as we require authentication
router.post("/enqueue", processFileUpload, taskController.enqueueTask);

module.exports = router;
