const Queue = require("bee-queue");

const queue = new Queue("tasks");

// Process tasks from the queue
const processQueue = async () => {
  queue.process(async (job, done) => {
    try {
      console.log("Processing job:", job.id);

      // Replace this with your actual task processing logic
      await processTask(job.data);

      console.log(`Job ${job.id} processed successfully`);
      done(null, { status: "completed", jobId: job.id });
    } catch (error) {
      console.error(`Error processing job ${job.id}:`, error);
      done(error);
    }
  });
};

// Function to simulate processing time (replace with your actual processing logic)
const processTask = async (taskData) => {
  console.log("Processing task:", taskData);
  await new Promise((resolve) => setTimeout(resolve, 5000)); // Simulated processing time of 5 seconds
  console.log("Task processed successfully");
};

module.exports = {
  processQueue,
};
