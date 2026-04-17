import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB, User } from "./db.js";
import router from "./routes/index.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to MongoDB
connectDB().catch((error) => {
  console.error("Failed to connect to MongoDB:", error);
  process.exit(1);
});

// Routes
app.use("/api/v1", router);

// Sample route
app.get("/", (req, res) => {
  res.json({ message: "Paytm Server is running" });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
