import { Request, Response } from "express";
import { prisma } from "../lib/prisma";

interface PaginatedResponse<T> {
	data: T[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
		hasNext: boolean;
		hasPrev: boolean;
	};
}

export async function getUsers(req: Request, res: Response): Promise<void> {
	try {
		const page = Math.max(1, Number(req.query.page) || 1);
		const limit = Math.min(100, Number(req.query.limit) || 10);

		const offset = (page - 1) * limit;

		const [users, totalItems] = await Promise.all([
			// users
			prisma.user.findMany({
				skip: offset,
				take: limit,
				orderBy: { id: "asc" },
			}),
			// totalItems
			prisma.user.count(),
		]);

		const totalPages = Math.ceil(totalItems / limit);

		const response: PaginatedResponse<(typeof users)[number]> = {
			data: users,
			pagination: {
				page,
				limit,
				total: totalItems,
				totalPages,
				hasNext: page < totalPages,
				hasPrev: page > 1,
			},
		};

		res.status(200).json({
			success: true,
			...response,
		});
	} catch (error) {
		console.error("error fetching users:", error);
		res.status(500).json({ success: false, error: "failed to fetch users" });
	}
}

export async function deleteUser(req: Request, res: Response) {
	const id = Number(req.params.id);
	await prisma.user.delete({ where: { id: id } });
	res.json({ message: "user deleted" });
}
