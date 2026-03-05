import healthRouter from "./health";
import usersRouter from "./users";
import errorRouter from "./error";
import postRouter from "./posts";
import articleRouter from "./articles";
import { Router } from "express";

const router: Router = Router();

router.use("/health", healthRouter);
router.use("/users", usersRouter);
router.use("/posts", postRouter);
router.use("/articles", articleRouter);
router.use("/error", errorRouter);

export default router;
