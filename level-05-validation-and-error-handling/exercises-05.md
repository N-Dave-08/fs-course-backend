# Exercises 05: Validation & Error Handling

## Learning Objectives

By completing these exercises, you will:
- ✅ Implement input validation with Zod
- ✅ Create error handling middleware
- ✅ Standardize error responses
- ✅ Handle validation errors
- ✅ Create custom error classes
- ✅ Practice error handling patterns

## Before You Start

**Prerequisites:**
- Express.js basics
- API development knowledge
- Understanding of validation concepts
- Zod package installed

**Setup:**
1. Navigate to `fs-course-backend/level-05-validation-and-error-handling/`
2. Install Zod: `pnpm add zod`
3. All exercises should be created in `project/src/`

**Windows note (PowerShell):**
PowerShell often aliases `curl` to `Invoke-WebRequest`. Use `curl.exe` if your curl commands behave unexpectedly.

---

## Exercise 1: Input Validation

**Objective:** Add Zod validation to API endpoints.

**Instructions:**
Create `project/src/middleware/validation.ts` with Zod schemas:
1. Validate user creation
2. Validate user update
3. Return clear error messages

**Expected Code Structure:**
```typescript
// project/src/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// User creation schema
const createUserSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

// User update schema (all fields optional)
const updateUserSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  email: z.string().email().optional(),
  password: z.string().min(8).optional(),
});

// Validation middleware factory
export function validate(schema: z.ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Validate request body
      const validated = schema.parse(req.body);
      // Replace body with validated data (stripped of extra fields)
      req.body = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        res.status(400).json({
          success: false,
          error: 'Validation failed',
          errors,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: 'Validation error',
      });
    }
  };
}

// Export specific validators
export const validateCreateUser = validate(createUserSchema);
export const validateUpdateUser = validate(updateUserSchema);
```

**Usage in Routes:**
```typescript
// project/src/routes/users.ts
import { validateCreateUser, validateUpdateUser } from '../middleware/validation';

router.post('/', validateCreateUser, async (req, res) => {
  // req.body is validated and typed
  const { name, email, password } = req.body;
  // ... create user
});

router.put('/:id', validateUpdateUser, async (req, res) => {
  // req.body contains only validated fields
  // ... update user
});
```

**Verification Steps:**
1. Test with valid data - should work
2. Test with invalid email - should return 400
3. Test with short password - should return 400
4. Check error messages are clear

**Expected Behavior:**
- Valid data passes through
- Invalid data returns 400
- Error messages are specific
- Extra fields are stripped

**File:** `project/src/middleware/validation.ts`

---

## Exercise 2: Error Middleware

**Objective:** Create global error handling middleware.

**Instructions:**
Create `project/src/middleware/errorHandler.ts`:
1. Global error middleware
2. Custom error classes
3. Proper error responses

**Expected Code Structure:**
```typescript
// project/src/middleware/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom error classes
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} not found`, 404);
  }
}

// Global error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const errors = err.errors.map((e) => ({
      field: e.path.join('.'),
      message: e.message,
    }));

    res.status(400).json({
      success: false,
      error: 'Validation failed',
      errors,
    });
    return;
  }

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
      ...(process.env.NODE_ENV === 'development' && {
        stack: err.stack,
      }),
    });
    return;
  }

  // Handle unknown errors
  console.error('Unexpected error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
  });
}
```

**Usage in Server:**
```typescript
// project/src/server.ts
import { errorHandler } from './middleware/errorHandler';

// Error handler must be last
app.use(errorHandler);
```

**Verification:**
- Custom errors work
- Validation errors handled
- Unknown errors handled
- Proper status codes

**File:** `project/src/middleware/errorHandler.ts`

---

## Exercise 3: Error Responses

**Objective:** Standardize error response format.

**Instructions:**
Create `project/src/utils/errors.ts` for consistent error responses.

**Expected Code Structure:**
```typescript
// project/src/utils/errors.ts
import { Response } from 'express';

interface ErrorResponse {
  success: false;
  error: string;
  errors?: Array<{ field: string; message: string }>;
  details?: any;
}

export function sendError(
  res: Response,
  statusCode: number,
  message: string,
  errors?: Array<{ field: string; message: string }>
): void {
  const response: ErrorResponse = {
    success: false,
    error: message,
  };

  if (errors) {
    response.errors = errors;
  }

  res.status(statusCode).json(response);
}

// Convenience functions
export function sendValidationError(
  res: Response,
  errors: Array<{ field: string; message: string }>
): void {
  sendError(res, 400, 'Validation failed', errors);
}

export function sendNotFoundError(res: Response, resource: string): void {
  sendError(res, 404, `${resource} not found`);
}

export function sendUnauthorizedError(res: Response, message: string = 'Unauthorized'): void {
  sendError(res, 401, message);
}

export function sendForbiddenError(res: Response, message: string = 'Forbidden'): void {
  sendError(res, 403, message);
}

export function sendInternalError(res: Response, message: string = 'Internal server error'): void {
  sendError(res, 500, message);
}
```

**Usage:**
```typescript
// In route handlers
import { sendNotFoundError, sendValidationError } from '../utils/errors';

router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: parseInt(req.params.id) } });
  
  if (!user) {
    return sendNotFoundError(res, 'User');
  }
  
  res.json({ success: true, data: user });
});
```

**Verification:**
- Error responses consistent
- Proper status codes
- Clear error messages

**File:** `project/src/utils/errors.ts`

---

## Running Exercises

### Start Server

```bash
cd project
pnpm dev
```

### Test Validation

```bash
# Valid request
curl.exe -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d "{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"password\":\"password123\"}"

# Invalid email
curl.exe -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d "{\"name\":\"Alice\",\"email\":\"invalid-email\",\"password\":\"password123\"}"

# Short password
curl.exe -X POST http://localhost:3001/api/users -H "Content-Type: application/json" -d "{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"password\":\"short\"}"
```

## Verification Checklist

After completing all exercises, verify:

- [ ] Zod validation works
- [ ] Error middleware catches errors
- [ ] Custom error classes work
- [ ] Error responses are consistent
- [ ] Validation errors are clear
- [ ] Status codes are correct
- [ ] All errors are handled

## Troubleshooting

### Issue: Zod not found

**Solution:**
```bash
cd project
pnpm add zod
```

### Issue: Validation not running

**Solution:**
- Check middleware order
- Verify middleware applied
- Check request body format

## Next Steps

1. ✅ **Review**: Understand validation and errors
2. ✅ **Experiment**: Add more validation rules
3. 📖 **Continue**: Move to [Level 6: Advanced Topics](../level-06-advanced-topics/lesson-01-file-uploads.md)
4. 💻 **Reference**: Check `project/` folder

---

**Key Takeaways:**
- Validate all input data
- Use Zod for schema validation
- Create custom error classes
- Standardize error responses
- Handle errors globally
- Provide clear error messages
- Use appropriate status codes

**Good luck! Happy coding! 🚀**
