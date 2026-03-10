import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { logger } from "../config/logger";

// GET /users
export async function getUsers(req: Request, res: Response) {
	/*
	  The validateQuery middleware stored the validated query values
	  inside a custom property called `_validatedQuery`.

	  Since Express's Request type does not know about this property,
	  we cast the request to a type that includes it.

	  This tells TypeScript:
	  "Trust me, this request object has _validatedQuery with page and limit."
	*/
	const query = (
		req as Request & { _validatedQuery: { page: number; limit: number } }
	)._validatedQuery;

	// Extract page and limit from the validated query
	const { page, limit } = query;

	/*
	  Convert the page number into a database offset.

	  Example:
	  page = 1, limit = 10 -> offset = 0
	  page = 2, limit = 10 -> offset = 10
	  page = 3, limit = 10 -> offset = 20

	  This tells the database how many records to skip.
	*/
	const offset = (page - 1) * limit;

	/*
	  Run two database queries at the same time.

	  Promise.all allows both queries to execute in parallel
	  instead of waiting for one to finish before starting the other.

	  Query 1: fetch the paginated users
	  Query 2: count the total number of users in the table

	  This improves performance slightly.
	*/
	const [users, totalItems] = await Promise.all([
		prisma.user.findMany({
			skip: offset, // how many rows to skip
			take: limit, // how many rows to return
			orderBy: { id: "asc" }, // consistent ordering
		}),
		prisma.user.count(),
	]);

	/*
	  Calculate the total number of pages.

	  Example:
	  totalItems = 95
	  limit = 10

	  totalPages = Math.ceil(95 / 10) = 10
	*/
	const totalPages = Math.ceil(totalItems / limit);

	/*
	  Send the response with both the data and pagination metadata.

	  The pagination object helps the frontend know:
	  - which page it is on
	  - how many pages exist
	  - if there is a next or previous page
	*/
	res.json({
		success: true,
		data: users,
		pagination: {
			page,
			limit,
			total: totalItems,
			totalPages,
			hasNext: page < totalPages, // true if another page exists after this one
			hasPrev: page > 1, // true if a previous page exists
		},
	});
}

// DELETE /users/:id
export async function deleteUser(req: Request, res: Response) {
	try {
		const id = Number(req.params.id); // convert string to number

		if (Number.isNaN(id)) {
			return res.status(400).json({ success: false, error: "Invalid user ID" });
		}

		const deleted = await prisma.user.delete({ where: { id } });

		res
			.status(200)
			.json({ success: true, message: "User deleted", user: deleted });
	} catch (error) {
		logger.error(
			`Error deleting user: ${error instanceof Error ? error.stack : JSON.stringify(error)}`,
		);
		res.status(404).json({ success: false, error: "User not found" });
	}
}
