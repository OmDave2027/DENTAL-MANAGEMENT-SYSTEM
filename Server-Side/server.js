import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";

import testMySQLConnection from "./configs/connectDB.js";
import authRoute from "./routes/authRoute.js"
import appointmentRoutes from "./routes/appointmentRoute.js";

dotenv.config();

const app = express();

const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://localhost:5020",
    "http://localhost:8000",
].filter(Boolean);

app.use(
    cors({
        origin: (origin, callback) => {
            if (!origin || allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.error("Blocked by CORS:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    })
);

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

app.use(helmet());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.get("/", (req, res) => {
    res.status(200).json({ message: "Server Running" });
});

// Routes
app.use("/api/auth", authRoute);
app.use("/api/appointments", appointmentRoutes);

const startServer = async () => {
    try {
        await testMySQLConnection();
        const port = process.env.PORT || 5020;
        app.listen(port, () => {
            console.log(`🚀 Server running on port ${port}`);
        })
    } catch (err) {
        console.error("Startup failed:", err);
        process.exit(1);
    }
};

startServer();
