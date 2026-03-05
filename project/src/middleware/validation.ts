import { NextFunction, Request, Response } from "express";

/*
ValidationRule describes how a field should be validated.
Each object in the rules array must follow this structure.
*/
interface ValidationRule {
	field: string; // The name of the field in req.body (e.g. "email")

	required?: boolean; // Optional: if true, the field must exist
	type?: "string" | "number" | "boolean" | "email"; // Optional: expected type of the value

	minLength?: number; // Optional: minimum characters for string fields
	maxLength?: number; // Optional: maximum characters for string fields
}

/*
validate() is a factory function.
It receives validation rules and returns an Express middleware.
*/
export function validate(rules: ValidationRule[]) {
	return (req: Request, res: Response, next: NextFunction): void => {
		// Container for all validation errors
		const errors: string[] = [];

		/*
		Loop through every validation rule provided
		Example rules array:
		[
		  { field: "email", required: true, type: "email" },
		  { field: "password", required: true, minLength: 8 }
		]
		*/
		for (const rule of rules) {
			/*
			Get the value from req.body dynamically using the field name.
			If rule.field = "email", this becomes:
			req.body["email"]
			*/
			const value = req.body[rule.field];

			/*
			REQUIRED FIELD VALIDATION
			If the field is required but missing or empty,
			add an error message.
			*/
			if (
				rule.required &&
				(value === undefined || value === null || value === "")
			) {
				errors.push(`${rule.field} is required`);
				continue; // skip remaining validations for this field
			}

			/*
			If the field is NOT required and it does not exist,
			skip all validation for this rule.
			*/
			if (!rule.required && (value === undefined || value === null)) {
				continue;
			}

			/*
			TYPE VALIDATION
			If a type rule exists, check whether the value matches the expected type.
			*/
			if (rule.type) {
				if (rule.type === "string" && typeof value !== "string") {
					errors.push(`${rule.field} must be a string`);
				}

				else if (rule.type === "number" && typeof value !== "number") {
					errors.push(`${rule.field} must be a number`);
				}

				else if (rule.type === "boolean" && typeof value !== "boolean") {
					errors.push(`${rule.field} must be a boolean`);
				}

				/*
				EMAIL VALIDATION
				Check if value matches an email pattern.
				*/
				else if (rule.type === "email") {
					if (typeof value !== "string") {
						errors.push(`${rule.field} must be a string`);
					} else {
						const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

						if (!emailRegex.test(value)) {
							errors.push(`${rule.field} must be a valid email`);
						}
					}
				}
			}

			/*
			STRING LENGTH VALIDATION
			Only run if the value is a string.
			*/
			if (typeof value === "string") {
				/*
				Check minimum length
				Example: password must be at least 8 characters
				*/
				if (rule.minLength && value.length < rule.minLength) {
					errors.push(
						`${rule.field} must be atleast ${rule.minLength} characters`,
					);
				}

				/*
				Check maximum length
				Example: username must be at most 20 characters
				*/
				if (rule.maxLength && value.length > rule.maxLength) {
					errors.push(
						`${rule.field} must be at most ${rule.maxLength} characters`,
					);
				}
			}
		}

		/*
		After validating ALL rules,
		check if any errors were collected.
		*/
		if (errors.length > 0) {
			/*
			Return HTTP 400 (Bad Request)
			and send the list of validation errors.
			*/
			res.status(400).json({
				success: false,
				error: "validation failed",
				errors,
			});
			return;
		}

		/*
		If no validation errors exist,
		continue to the next middleware or route handler.
		*/
		next();
	};
}