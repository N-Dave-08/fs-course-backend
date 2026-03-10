
import articleRouter from "./articles.routes";
import errorRouter from "./error.routes";
import healthRouter from "./health.routes";
import postRouter from "./posts.routes";
import usersRouter from "./users.routes";
import uploadRouter from "./upload.routes";
import { Router } from "express";

const router: Router = Router();

router.use("/health", healthRouter);
router.use("/users", usersRouter);
router.use("/posts", postRouter);
router.use("/articles", articleRouter);
router.use("/upload", uploadRouter);
router.use("/error", errorRouter);

export default router;
