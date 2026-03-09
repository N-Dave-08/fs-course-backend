import type { Request, Response } from "express";
import { Router } from "express";
import { prisma } from "../lib/prisma";
import { deleteUser, getUsers } from "../controllers/user.controller";
import { authenticate } from "../middleware/authenticate.middleware";
import { authorizeOwnerOrAdmin } from "../middleware/authorize-admin-or-owner.middleware";
import { AuthRequest } from "../types/auth-request";
import { validateQuery } from "../middleware/validate-query.middleware";
import { paginationSchema } from "../validators/pagination.validator";
import { validate } from "../middleware/validate.middleware";
import { updateUserSchema } from "../validators/user.validation";
import { AppError, NotFoundError } from "../middleware/error-handler";
import { sendError, sendNotFoundError } from "../utils/error";

const router: Router = Router();

// GET /api/users
router.get(
	"/",
	validateQuery(paginationSchema),
	async (req: Request, res: Response) => {
		await getUsers(req, res);
	},
);

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

	if (!user) return sendNotFoundError(res, "User");

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
			return sendNotFoundError(res, "User");
		}
		res.status(200).json(user);
	} catch (error) {
		console.error("error fetching user: ", error);
		throw error;
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
router.put(
	"/:id",
	validate(updateUserSchema),
	async (req: Request, res: Response) => {
		try {
			// 1️⃣ Parse and validate ID
			const id = Number(req.params.id);
			if (Number.isNaN(id)) {
				// Invalid ID → return 400 using errorHandler
				return sendError(res, 400, "Invalid user ID");
			}

			const { email, name, age, bio } = req.body;

			// 2️⃣ Check if the user exists
			const existingUser = await prisma.user.findUnique({
				where: { id },
			});

			if (!existingUser) {
				// User not found → 404
				return sendNotFoundError(res, "User");
			}

			// 3️⃣ Check for unique email if it’s being updated
			if (email && email !== existingUser.email) {
				const emailExists = await prisma.user.findUnique({
					where: { email },
				});
				if (emailExists) {
					return sendError(res, 409, "email already exists");
				}
			}

			// 4️⃣ Perform the update
			const user = await prisma.user.update({
				where: { id },
				data: {
					...(email && { email }),
					...(name && { name }),
					...(age && { age }),
					...(bio && { bio }),
				},
			});

			// 5️⃣ Return updated user
			return res.json({ success: true, data: user });
		} catch (error) {
			console.error("Error updating user:", error);

			// 6️⃣ Unexpected errors → 500, goes to consistent format
			throw error;
		}
	},
);

// DELETE /api/users/:id
router.delete(
	"/:id",
	authenticate,
	authorizeOwnerOrAdmin((req: AuthRequest) => Number(req.params.id)),
	deleteUser,
);

export default router;
