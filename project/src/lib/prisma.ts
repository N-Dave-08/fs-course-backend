import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import {Pool} from "pg"
import "dotenv/config";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
	throw new Error("DATABASE_URL is not in .env")
}

const pool = new Pool({connectionString})
const adapter = new PrismaPg(pool)

const prismaClientSingleton = () =>
	new PrismaClient({
		adapter,
		log:
			process.env.NODE_ENV === "development"
				? ["query", "error", "warn"]
				: ["error"],
	});

const prisma = globalForPrisma.prisma ?? prismaClientSingleton()

if (process.env.NODE_ENV !== "production") {
	globalForPrisma.prisma = prisma;
}

export {prisma}