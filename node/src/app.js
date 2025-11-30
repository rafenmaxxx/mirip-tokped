import express from "express";
import dotenv from "dotenv";

dotenv.config();

const app = express();

const PORT = process.env.NODE_PORT || 3000;
const REDIS_HOST = process.env.REDIS_HOST;
const REDIS_PORT = process.env.REDIS_PORT;

app.get("node/api/hello", (req, res) => {
  res.json({
    message: "Hello from Node!",
    redis: `${REDIS_HOST}:${REDIS_PORT}`,
  });
});

app.listen(PORT, () => {
  console.log(`Node API running on port ${PORT}`);
});
