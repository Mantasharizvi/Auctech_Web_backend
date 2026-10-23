
import "dotenv/config";
import express from "express";
import cors from "cors";
import morgan from "morgan";
import connectDB from "./config/db.js";
import { errorHandler } from "./middlewares/errorHandler.js";

import authRoutes from "./router/authRoutes.js";
import accessRoutes from "./router/accessRoutes.js";
import uploadRoutes from "./router/uploadRoutes.js";
import websiteRoutes from "./router/websiteRoutes.js";
import reelRoutes from "./router/reelRoutes.js";
import postRoutes from "./router/postRoutes.js";
import dashboardRoutes from "./router/dashboardRoutes.js";
import contactRoutes from "./router/contactRoutes.js";
import categoryRoutes from "./router/categoryRoutes.js";

const app = express();
app.set("trust proxy", 1);

// CORS: allow requests from any host / domain
app.use(cors());

app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.use("/api/auth", authRoutes);
app.use("/api/access", accessRoutes);
app.use("/api/upload", uploadRoutes);
app.use("/api/websites", websiteRoutes);
app.use("/api/website-categories", categoryRoutes);
app.use("/api/reels", reelRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/contact-queries", contactRoutes);

app.get("/", (req, res) =>
  res.json({ success: true, message: "AUCTECH API is running" })
);

app.use((req, res) =>
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.method} ${req.originalUrl}`,
  })
);

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

(async () => {
  try {
    await connectDB();
    app.listen(PORT, () =>
      console.log(`🚀 Server running on port ${PORT}`)
    );
  } catch (error) {
    console.error("❌ Server startup failed:", error.message);
    process.exit(1);
  }
})();
