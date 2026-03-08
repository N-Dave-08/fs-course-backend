import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { deleteUser, getUsers } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate.middleware";
import { authorizeOwnerOrAdmin } from "../middleware/authorize-admin-or-owner.middleware";
import { AuthRequest } from "../types/auth-request";

const router: Router = Router();

// GET /api/users
router.get("/", async (req: Request, res: Response) => {
	getUsers(req, res);
});

// GET /api/users/me
router.get("/me", authenticate, async (req: Request, res: Response) => {
	// const userPayload = (req as any).user;

	const user = await prisma.user.findUnique({
		where: { id: 31 },
		select: {
			id: true,
			name: true,
			email: true,
			bio: true,
			roles: {
				include: {
					roles: true,
				},
			},
		},
	});

	if (!user) return res.status(404).json({ error: "user not found" });

	res.json(user);
});

// GET /api/users/:id
router.get("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ error: "invalid user id" });
		}

		const user = await prisma.user.findUnique({
			where: {
				id: id,
			},
		});

		if (!user) {
			return res.status(404).json({ error: "user not found" });
		}
		res.status(200).json(user);
	} catch (error) {
		console.error("error fetching user: ", error);
		res.status(500).json({ error: "failed to fetch user" });
	}
});

// create many users
// router.post("/create-many-users", async (res: Response) => {
// 	try {
// 		await prisma.user.createMany({
// 			data: users,
// 			skipDuplicates: true,
// 		});

// 		res.json({ message: "successfully created dummy users" });
// 	} catch (error) {
// 		console.error("error creating many users:", error);
// 		res.status(500).json({ error: "failed to create many users" });
// 	}
// });

// PUT /api/users/:id
router.put("/:id", async (req: Request, res: Response) => {
	try {
		const id = Number(req.params.id);

		if (Number.isNaN(id)) {
			return res.status(400).json({ error: "invalid user id" });
		}

		const { email, name, age, bio } = req.body;

		const existingUser = await prisma.user.findUnique({
			where: {
				id: id,
			},
		});

		if (!existingUser) {
			return res.status(409).json({ error: "user not found" });
		}

		if (email && email !== existingUser.email) {
			const emailExists = await prisma.user.findUnique({
				where: { email },
			});
			if (emailExists) {
				return res.status(409).json({ error: "email already exists" });
			}
		}

		const user = await prisma.user.update({
			where: { id },
			data: {
				...(email && { email }),
				...(name && { name }),
				...(age && { age }),
				...(bio && { bio }),
			},
		});

		res.json(user);
	} catch (error) {
		console.error("error updating user:", error);
		res.status(500).json({ error: "failed updating user" });
	}
});

// DELETE /api/users/:id
router.delete(
	"/:id",
	authenticate,
	authorizeOwnerOrAdmin((req: AuthRequest) => Number(req.params.id)),
	deleteUser
);

export default router;
