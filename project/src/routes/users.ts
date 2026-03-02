import { type Request, type Response, Router } from "express";
import { users } from "../helpers/users";

const router: Router = Router();

// Level 1: Exercise 2
router.get("/", (req: Request, res: Response) => {
	res.json(users);
});

// Level 1: Exercise 2
router.get("/:id", (req: Request, res: Response) => {
	const id = parseInt(req.params.id as string, 10);
	const user = users.find((u) => u.id === id);

	if (!user) {
		return res.status(404).json({ error: "user not found" });
	}

	res.json(user);
});

router.post("/", (req: Request, res: Response) => {
	const { name } = req.body;

	if (!name) {
		return res.status(400).json({ error: "name is required" });
	}

	const newUser = {
		id: users.length + 1,
		name,
	};

	users.push(newUser);
	res.status(201).json(newUser);
});

export default router;
