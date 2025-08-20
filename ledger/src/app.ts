import cors from "cors";
import express from "express";
import helmet from "helmet";
import { notFound } from "./middlewares/notFound";
import { handleError } from "./middlewares/handleError";
import { logger } from './middlewares/logger';
import { initializeDatabase } from './db/utils'

const app = express();

(async () => await initializeDatabase())();

app.use(logger);
app.use(helmet());
app.use(cors());
app.use(express.json());

app.get("/heartbeat", (req, res) => {
  res.json({
    message: "Server alive and running.",
  });
});

app.use(notFound);
app.use(handleError);

export default app;
