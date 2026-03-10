import { Router } from "express";
import { register, login, me } from "../controllers/auth.controller";
import { authenticate } from "../middleware/authenticate.middleware";
import { validate } from "../middleware/validate.middleware";
import { loginSchema, registerSchema } from "../validators/auth.validator";
import { authLimiter } from "../middleware/rate-limiter";

const router: Router = Router();

// POST /auth/register
router.post("/register", authLimiter, validate(registerSchema), register);

// POST /auth/login
router.post("/login", authLimiter, validate(loginSchema), login);

// GET /auth/me → must be authenticated
router.get("/me", authenticate, me);

export default router;
