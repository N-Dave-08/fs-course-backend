import dotenv from "dotenv";
import jwt from "jsonwebtoken";

dotenv.config();

const user = { id: "31" };

const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET!, {
	expiresIn: "7d",
});

console.log(token);

const decode = jwt.verify(token, process.env.JWT_SECRET!);

console.log(decode);
