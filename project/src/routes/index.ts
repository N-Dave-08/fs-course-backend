import { Router } from "express";
import healthRouter from "./health";
import usersRouter from "./users";
import errorRouter from "./error"
import postRouter from "./posts"

const router: Router = Router();

router.use("/health", healthRouter);
router.use("/users", usersRouter);
router.use("/posts", postRouter);
router.use("/error", errorRouter);

export default router;
