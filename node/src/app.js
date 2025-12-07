import express from "express";
import routes from "./routes/index.js";
import r_webpush from "./routes/r_webpush.js";
import { notFound, errorHandler } from "./middleware/ErrorHandler.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(routes);

app.use(notFound);
app.use(errorHandler);

export default app;
