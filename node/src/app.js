import express, { raw } from "express";
import routes from "./routes/index.js";
import { notFound, errorHandler } from "./middleware/ErrorHandler.js";

const app = express();

app.use((req, res, next) => {
  const rawCookies = req.headers.cookie; // "sessid=abc123; foo=bar"
  console.log("cookie raw : ", rawCookies);
  req.cookies = Object.fromEntries(
    rawCookies?.split("; ").map((c) => c.split("=")) || []
  );
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
