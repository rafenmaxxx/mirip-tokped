import express, { raw } from "express";
import cors from "cors";
import session from "express-session";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/ErrorHandler.js";

const app = express();

app.use(cors({
  origin: ["http://localhost:80", "http://localhost:80/react"],
  credentials: true,
}))

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  const rawCookies = req.headers.cookie; // "sessid=abc123; foo=bar"
  console.log("cookie raw : ", rawCookies);
  req.cookies = Object.fromEntries(
    rawCookies?.split("; ").map((c) => c.split("=")) || []
  );
  next();
});

app.use(session({
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, // 24 hours
    sameSite: 'lax',
    path: '/',
  }
}));

// Debug middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  console.log("Session ID:", req.sessionID);
  console.log("Session user:", req.session?.user);
  next();
});

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
