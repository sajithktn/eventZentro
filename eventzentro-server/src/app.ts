import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();

app.use(
    cors({
        origin: "http://localhost:3000",
        credentials: true
    })
);

app.use(express.json());

app.use(express.urlencoded({ extended: true}));

app.use(cookieParser());


app.get("/", (_req, res) => {
    res.status(200).json({
        success: true,
        message: "Welcome to EventZentro API 🚀",
    });
});

export default app;