const Queue = require("bee-queue");

const queue = new Queue("tasks");

// Controller function to enqueue a task
const enqueueTask = async (req, res) => {
  const taskData = { fields: req.body, files: req.file };

  try {
    let job = await queue.createJob(taskData).save();
    res
      .status(202)
      .json({ message: "Task enqueued successfully", jobId: job.id });
  } catch (error) {
    console.error("Error enqueuing task:", error);
    res.status(500).json({ error: "Error enqueuing task" });
  }
};

module.exports = {
  enqueueTask,
};
