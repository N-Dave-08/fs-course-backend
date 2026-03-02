import { Router } from "express";
import { users } from "../helpers/users";
import type { Request, Response, NextFunction } from "express";

const router: Router = Router();

// middleware demo
router.get("/", (req, res, next) => {
	console.log("middlware is working");
	console.log(`${req.method} ${req.path}`);
	next();
	res.json({ users });
});

export default router;
