import express from "express";
import routes from "./routes/index.routes";
import { corsMiddlware, jsonParser, requestLogger } from "./middleware";
import jwt from "jsonwebtoken";
import { errorMiddleware } from "./middleware/error.middleware";
import { errorHandler } from "./middleware/error-handler";

const app = express();
const PORT = 3001;

app.use(express.json());

app.use(corsMiddlware);
app.use(jsonParser);
app.use(requestLogger);

app.use("/api", routes);

app.use(errorHandler);
app.use(errorMiddleware);

app.listen(PORT, () => {
	console.log(`server running on port ${PORT}`);
});
