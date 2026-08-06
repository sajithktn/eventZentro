import "dotenv/config";

import { connectRedis } from "./config/redis";
import connectDB from "./config/db";
import app from "./app";
import {
  startEventLifecycleScheduler,
} from "./services/eventLifecycle.service";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();
    startEventLifecycleScheduler();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start");
    console.error(error);
  }
};

startServer();
