import { Router } from "express";

const router: Router = Router();

router.get("/error", () => {
	throw new Error("test error");
});

export default router;
