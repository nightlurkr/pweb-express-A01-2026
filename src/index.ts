import "dotenv/config";
import express from "express";
import { logger } from "./middleware/logger.js";
import { notFound, errorHandler } from "./middleware/error-handler.js";
import { sendOk } from "./lib/respond.js";
import { heroRouter } from "./routes/heroes.js";
import { skinRouter } from "./routes/skins.js";
import { playerRouter } from "./routes/players.js";
import { transactionRouter } from "./routes/transactions.js";
import { statisticsRouter } from "./routes/statistics.js";

const app = express();

app.use(express.json());
app.use(logger);

app.get("/health", (_req, res) => {
  sendOk(res, 200, "Server MLBB Shop berjalan", { uptime: process.uptime() });
});

app.use("/api/heroes", heroRouter);
app.use("/api/skins", skinRouter);
app.use("/api/players", playerRouter);
app.use("/api/players", transactionRouter);
app.use("/api/statistics", statisticsRouter);

app.use(notFound);
app.use(errorHandler);

const port = Number(process.env["PORT"] ?? 3000);
app.listen(port, () => {
  console.log(`MLBB Shop siap di http://localhost:${port}`);
});
