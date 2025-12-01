import dotenv from "dotenv";
dotenv.config();

export const ENV = {
  PORT: process.env.NODE_PORT || 3000,
  REDIS_HOST: process.env.REDIS_HOST || "localhost",
  REDIS_PORT: process.env.REDIS_PORT || 6379,
};
