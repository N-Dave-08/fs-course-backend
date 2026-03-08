import bcrypt from "bcrypt";
import { prisma } from "../lib/prisma";

async function backfillPasswords() {
	const hash = await bcrypt.hash("password", 10);

	await prisma.user.updateMany({
		where: {
			password: null,
		},
		data: {
			password: hash,
		},
	});

	console.log("passwords filled");
}

backfillPasswords();
