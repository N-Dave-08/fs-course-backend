import express from "express";
import routes from "./routes/index.routes";
import {
	corsMiddlware,
	errorHandler,
	jsonParser,
	requestLogger,
} from "./middleware";
import jwt from "jsonwebtoken";

const app = express();
const PORT = 3001;

app.use(express.json());

app.use(corsMiddlware);
app.use(jsonParser);
app.use(requestLogger);

app.use("/api", routes);

app.use(errorHandler);

app.listen(PORT, () => {
	console.log(`server running on port ${PORT}`);
});
