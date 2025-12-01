import { ENV } from "../config/env.js";

export const hello = (req, res) => {
  res.json({
    message: "Hello from Node!",
    redis: `${ENV.REDIS_HOST}:${ENV.REDIS_PORT}`,
  });
};
