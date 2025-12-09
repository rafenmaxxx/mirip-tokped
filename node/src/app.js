import express, { raw } from "express";
import cors from "cors";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/ErrorHandler.js";

const app = express();

app.use(
  cors({
    origin: ["http://localhost:80", "http://localhost:80/react"],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Cookie parser
app.use((req, res, next) => {
  const rawCookies = req.headers.cookie; // "sessid=abc123; foo=bar"
  req.cookies = Object.fromEntries(
    rawCookies?.split("; ").map((c) => c.split("=")) || []
  );
  next();
});

// Debug middleware - JWT version
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  const authHeader = req.headers.authorization;
  if (authHeader) {
    console.log(
      "Authorization header present:",
      authHeader.substring(0, 20) + "..."
    );
  }
  next();
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
