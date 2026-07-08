import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import connectDB from "./config/db";


const PORT = process.env.PORT || 5000;

const startServer = async () => {
    try {
        await connectDB();

        app.listen(PORT, () => {
            console.log(`🚀 Server is Running on http://localhost:${PORT}`);  
        });
    } catch (error) {
        console.error("❌ Server failed to start")
        console.error(error);
    }
};

startServer();