import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
	const roles = ["ADMIN", "USER", "MODERATOR"];

	for (const roleName of roles) {
		await prisma.role.upsert({
			where: { name: roleName },
			update: {},
			create: { name: roleName },
		});
	}

	console.log("roles seeded successfully");
}
main()
	.catch((e) => console.error(e))
	.finally(async () => {
		await prisma.$disconnect;
	});
