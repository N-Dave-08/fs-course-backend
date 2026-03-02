import 'dotenv/config'
import express from "express";
import userRouter from "./routes/userRoutes"
import playgroundRouter from "./routes/playground"
import cors from "cors"
import helmet from "helmet"
import { errorHandler } from './middleware/errorHandler';
import logger from './middleware/logger';
import { asyncHandler } from './middleware/asyncHandler';
import requestIdMiddleware from './middleware/requestId';

const app = express();
const PORT = process.env.PORT;

app.use(express.json({limit: "1mb"}))

app.use(helmet())
app.use(cors())

app.use(logger)

app.use("/api/users", userRouter)
app.use("/api/demo", playgroundRouter)

app.use(requestIdMiddleware)
app.use(errorHandler)

const users = Array.from({length: 50}, (_, i) => ({
    id: i + 1,
    name: `user ${i + 1}`,
}))

app.get("/health", (req, res) => {
	res.json({ ok: true, uptimeSeconds: Math.floor(process.uptime()) });
});

app.get('/', (req, res) => {
    // res.json({message: "Hello Express"})
    res.send(`Hello! Your request ID is ${(req as any).requestId}`)
})

app.post("/echo", (req, res) => {
    const {message} = req.body ?? {}

    if (typeof message !== "string" || message.trim().length === 0) {
        return res.status(400).json({
            error: "validation error",
            message: "`message`"
        })
    }

    return res.status(201).json({
        message: "created",
        data: {
            message: message.trim()
        }
    })
})

app.get("/boom", asyncHandler(async (req, res) => {
    throw new Error("Boom")
}))

app.get("/posts/:id", (req, res) => {
    const id = Number(req.params.id)
    if (!Number.isFinite(id)) return res.status(400).json({error: "invalid id"})
    res.json({postId: id})
})

app.listen(PORT, () => [
	console.log(`server running on http://localhost${PORT}`),
]);
