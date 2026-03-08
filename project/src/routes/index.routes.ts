import authRouter from "./auth.routes";
import articleRouter from "./articles.routes";
import errorRouter from "./error.routes";
import healthRouter from "./health.routes";
import postRouter from "./posts.routes";
import usersRouter from "./users.routes";
import { Router } from "express";

const router: Router = Router();

router.use("/health", healthRouter);
router.use("/users", usersRouter);
router.use("/auth", authRouter);
router.use("/posts", postRouter);
router.use("/articles", articleRouter);
router.use("/error", errorRouter);

export default router;
