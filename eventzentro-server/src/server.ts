import dotenv from "dotenv";

dotenv.config();

import { connectRedis } from "./config/redis";
import connectDB from "./config/db";
import app from "./app";

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();
    await connectRedis();

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Server failed to start");
    console.error(error);
  }
};

startServer();