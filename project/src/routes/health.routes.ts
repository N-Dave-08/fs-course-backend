import { type Request, type Response, Router } from "express";

const router: Router = Router();

router.get("/health", (req: Request, res: Response) => {
	res.json({ status: "ok" });
});

export default router;
