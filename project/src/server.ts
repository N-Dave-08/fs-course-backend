import express from "express";
import routes from "./routes/index.routes";
import { corsMiddlware, jsonParser, requestLogger } from "./middleware";
import { errorMiddleware } from "./middleware/error.middleware";
import { errorHandler } from "./middleware/error-handler";
import { apiLimiter, authLimiter } from "./middleware/rate-limiter";
import authRouter from './routes/auth.routes'
import { logger } from "./config/logger";

const app = express();
const PORT = 3001;

// Core Express JSON parser
app.use(express.json());

// Custom middlewares
app.use(corsMiddlware);
app.use(jsonParser);
app.use(requestLogger);

// --- Rate limiter applied BEFORE routes ---
app.use("/api/auth", authRouter);
app.use("/api", apiLimiter); // limiter first
app.use("/api", routes); // then routes

// Error handling middlewares (last)
app.use(errorHandler);
app.use(errorMiddleware);

app.listen(PORT, () => {
	console.log(`Server running on port ${PORT}`);
});
