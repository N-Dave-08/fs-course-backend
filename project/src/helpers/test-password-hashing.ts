import bcrypt from "bcrypt";

async function testHashPassword() {
	const password = "mypassword123";
	const saltRounds = 12;
	const hashPassword = await bcrypt.hash(password, saltRounds);

	console.log("original password: ", password);
	console.log("hashed password: ", hashPassword);

	const isValid = await bcrypt.compare(password, hashPassword);
	console.log("is the password correct? ", isValid);
}

testHashPassword();
