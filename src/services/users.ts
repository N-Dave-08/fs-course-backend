import { PrismaClient, type User } from "@prisma/client";

const prisma = new PrismaClient();

export const getAllUsers = async (): Promise<User[]> => {
	return prisma.user.findMany();
};
