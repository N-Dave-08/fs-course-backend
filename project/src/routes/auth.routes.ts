import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate.middleware";

const router: Router = Router();

// POST /auth/register
router.post("/register", register);

// POST /auth/login
router.post("/login", login);

// GET /auth/me → must be authenticated
router.get("/me", authenticate, me);

export default router;
