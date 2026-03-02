import { Router } from "express";
import { type User, users } from "../helpers/users";

const router: Router = Router();

// parse postive integer
function parsePositiveInt(value: string): number | null {
	const n = Number(value);
	if (!Number.isInteger(n) || n <= 0) return null;
	return n;
}

// parse integer
function parseIntOr(value: unknown, fallback: number): number {
	// return fallback if value is not string
	if (typeof value !== "string") return fallback;
	const n = Number(value);
	// return fallback if converted value to number is not integer
	if (!Number.isInteger(n)) return fallback;
	return n;
}

// GET /api/users/:id
router.get("/:id", (req, res) => {
	const id = parsePositiveInt(req.params.id);
	if (id === null) return res.status(400).json({ error: "invalid id" });

	return res.json({ userId: id });
});

// GET /api/users?page=1&limit=20
router.get("/", (req, res) => {
	const page = Math.max(1, parseIntOr(req.query.page, 1));
	const limit = Math.min(20, Math.max(1, parseIntOr(req.query.limit, 20)));

	const startIndex = (page - 1) * limit;
	const endIndex = startIndex + limit;

	return res.json({
		page,
		limit,
		totalUsers: users.length,
		totalPages: Math.ceil(users.length / limit),
		users: users.slice(startIndex, endIndex),
	});
});

// GET /api/users?q=value
router.get("/search", (req, res) => {
	const { q } = req.query;
	res.json({ query: q });
});

// POST /api/users
router.post("/", (req, res) => {
	const { name } = req.body ?? {};

	if (typeof name !== "string" || name.trim().length === 0) {
		return res.status(400).json({ error: "invalid name" });
	}

	const nextId = (users.at(-1)?.id ?? 0) + 1;
	const user: User = { id: nextId, name: name.trim() };
	users.push(user);

	return res.status(201).json({ user });
});

export default router;
