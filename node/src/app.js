import express from "express";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/ErrorHandler.js";
import { UserService } from "./service/s_user.js";

const app = express();

// Middleware dasar
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Health check
app.get("/health", (req, res) => {
  res.json({ status: "OK", timestamp: Date.now() });
});


// Routes utama
app.use(routes);

// Error middleware
app.use(notFound);
app.use(errorHandler);

export default app;
