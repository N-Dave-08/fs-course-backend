# Exercises 04: Authentication & Security

## Learning Objectives

By completing these exercises, you will:
- ✅ Implement user registration with password hashing
- ✅ Create login endpoint with JWT
- ✅ Build authentication middleware
- ✅ Implement role-based authorization
- ✅ Secure API endpoints
- ✅ Practice security best practices

## Before You Start

**Prerequisites:**
- Express.js basics
- Database integration
- Understanding of JWT
- Prisma set up

**Setup:**
1. Navigate to `fs-course-backend/level-04-authentication-security/`
2. Ensure JWT and bcrypt packages installed
3. Database with User model ready

**Windows note (PowerShell):**
PowerShell often aliases `curl` to `Invoke-WebRequest`. Use `curl.exe` if your curl commands behave unexpectedly.

---

## Exercise 1: User Registration

**Objective:** Create registration endpoint with password hashing.

**Instructions:**
Create registration endpoint in `project/src/routes/auth.ts`:
1. Hash passwords with bcrypt
2. Store in database
3. Return user (without password)

**Expected Code Structure:**
```typescript
// project/src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { prisma } from '../lib/prisma';

const router = Router();

// POST /api/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, name, password } = req.body;

    // Validation
    if (!email || !name || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email, name, and password are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        error: 'User with this email already exists',
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return res.status(400).json({
        success: false,
        error: 'Password must be at least 8 characters',
      });
    }

    // Hash password
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword, // Store hashed password (recommended naming)
      },
      select: {
        id: true,
        email: true,
        name: true,
        createdAt: true,
        // passwordHash is NOT selected - never return it!
      },
    });

    res.status(201).json({
      success: true,
      data: user,
      message: 'User registered successfully',
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to register user',
    });
  }
});

export default router;
```

**Verification Steps:**
1. Test registration with valid data
2. Test with duplicate email (should fail)
3. Test with weak password (should fail)
4. Verify password is hashed in database
5. Verify password not in response

**Expected Behavior:**
- Passwords hashed before storage
- Duplicate emails rejected
- Weak passwords rejected
- User returned without password

**Hints:**
- Use `bcrypt.hash()` with salt rounds
- Never return password in response
- Use `select` to exclude password
- Validate input before hashing

**Common Mistakes:**
- ❌ Storing plain text passwords
- ❌ Returning password in response
- ❌ Not validating password strength
- ❌ Not checking for duplicates

**File:** `project/src/routes/auth.ts`

---

## Exercise 2: Login

**Objective:** Create login endpoint with JWT generation.

**Instructions:**
Create login endpoint in `project/src/routes/auth.ts`:
1. Verify credentials
2. Generate JWT token
3. Return token

**Expected Code Structure:**
```typescript
// Add to project/src/routes/auth.ts
import jwt from 'jsonwebtoken';

// POST /api/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Email and password are required',
      });
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists (security)
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const secret = process.env.JWT_SECRET;
    if (!secret) {
      throw new Error('JWT_SECRET is not configured');
    }

    const token = jwt.sign(
      {
        userId: user.id,
        email: user.email,
      },
      secret,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    // Return token and user (without password)
    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    });
  }
});
```

**Verification Steps:**
1. Register a user first
2. Login with correct credentials - should get token
3. Login with wrong password - should fail
4. Login with non-existent email - should fail (same message)

**Expected Behavior:**
- Valid credentials return token
- Invalid credentials return 401
- Token includes user info
- Password never in response

**Hints:**
- Use `bcrypt.compare()` to verify
- Same error message for security
- Token expires as configured
- Store token securely on client

**Common Mistakes:**
- ❌ Revealing if email exists
- ❌ Not hashing passwords
- ❌ Wrong JWT secret
- ❌ Token not expiring

**File:** Update `project/src/routes/auth.ts`

---

## Exercise 3: Protected Routes

**Objective:** Create authentication middleware.

**Instructions:**
Create `project/src/middleware/auth.ts`:
1. Verify JWT tokens
2. Add user to request
3. Protect routes

**Expected Code Structure:**
```typescript
// project/src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma';

// Extend Express Request type
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        name: string;
      };
    }
  }
}

export async function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        error: 'No token provided',
      });
      return;
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
      throw new Error('JWT_SECRET not configured');
    }

    // Verify token
    const decoded = jwt.verify(token, secret) as {
      userId: number;
      email: string;
    };

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: 'User not found',
      });
      return;
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        error: 'Token has expired',
      });
      return;
    }

    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        error: 'Invalid token',
      });
      return;
    }

    console.error('Auth error:', error);
    res.status(500).json({
      success: false,
      error: 'Authentication failed',
    });
  }
}
```

**Usage in Routes:**
```typescript
// project/src/routes/profile.ts
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';

const router = Router();

// Protected route
router.get('/me', authenticate, async (req: Request, res: Response) => {
  // req.user is available because of authenticate middleware
  res.json({
    success: true,
    data: req.user,
  });
});

export default router;
```

**Verification Steps:**
1. Try accessing protected route without token - should fail
2. Login to get token
3. Access protected route with token - should work
4. Use expired token - should fail

**Expected Behavior:**
- Unauthenticated requests rejected
- Authenticated requests proceed
- User available in `req.user`
- Clear error messages

**File:** `project/src/middleware/auth.ts`

---

## Exercise 4: Authorization

**Objective:** Add role-based access control.

**Instructions:**
1. Add `role` field to User model
2. Create `requireRole` middleware
3. Protect admin routes

**Step-by-Step:**

1. **Update Prisma Schema:**
```prisma
model User {
  id        Int      @id @default(autoincrement())
  email     String   @unique
  name      String
  passwordHash String
  role      String   @default("user") // Add role field
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}
```

2. **Create Migration:**
```bash
npx prisma migrate dev --name add_user_role
```

3. **Create Authorization Middleware** (`project/src/middleware/authorization.ts`):
```typescript
// project/src/middleware/authorization.ts
import { Request, Response, NextFunction } from 'express';

export function requireRole(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Must be used after authenticate middleware
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: 'Authentication required',
      });
      return;
    }

    // Check if user has required role
    // Note: You'll need to fetch full user with role from database
    // For now, assume role is in req.user (update authenticate middleware)
    const userRole = (req.user as any).role || 'user';
    
    if (!allowedRoles.includes(userRole)) {
      res.status(403).json({
        success: false,
        error: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}
```

4. **Update Authenticate Middleware** to include role:
```typescript
// Update authenticate middleware to fetch role
const user = await prisma.user.findUnique({
  where: { id: decoded.userId },
  select: {
    id: true,
    email: true,
    name: true,
    role: true, // Include role
  },
});

req.user = user; // Now includes role
```

5. **Use in Routes:**
```typescript
// Admin-only route
router.delete('/users/:id', 
  authenticate, 
  requireRole('admin'),
  async (req, res) => {
    // Only admins can access this
  }
);
```

**Verification Steps:**
1. Create admin user
2. Try accessing admin route as regular user - should fail
3. Access as admin - should work
4. Test with different roles

**Expected Behavior:**
- Role-based access works
- Unauthorized users get 403
- Admin routes protected
- Clear error messages

**File:** Update `project/prisma/schema.prisma` and create `project/src/middleware/authorization.ts`

---

## Running Exercises

### Start Server

```bash
cd project
pnpm dev
```

### Test Endpoints

**Registration:**
```bash
curl.exe -X POST http://localhost:3001/api/auth/register -H "Content-Type: application/json" -d "{\"name\":\"Alice\",\"email\":\"alice@example.com\",\"password\":\"password123\"}"
```

**Login:**
```bash
curl.exe -X POST http://localhost:3001/api/auth/login -H "Content-Type: application/json" -d "{\"email\":\"alice@example.com\",\"password\":\"password123\"}"
```

**Protected Route:**
```bash
# Get token from login, then:
curl.exe http://localhost:3001/api/profile/me -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Verification Checklist

After completing all exercises, verify:

- [ ] Registration hashes passwords
- [ ] Login generates JWT tokens
- [ ] Authentication middleware works
- [ ] Protected routes require auth
- [ ] Authorization middleware works
- [ ] Role-based access enforced
- [ ] Errors handled properly
- [ ] Security best practices followed

## Troubleshooting

### Issue: "bcrypt not found"

**Solution:**
```bash
cd project
pnpm add bcrypt
pnpm add -D @types/bcrypt
```

### Issue: JWT errors

**Solution:**
- Check JWT_SECRET in .env
- Verify token format
- Check expiration

### Issue: Password comparison fails

**Solution:**
- Verify password was hashed on registration
- Check bcrypt.compare() usage
- Ensure same salt rounds

## Next Steps

1. ✅ **Review**: Understand authentication flow
2. ✅ **Experiment**: Add more security features
3. 📖 **Continue**: Move to [Level 5: Validation and Error Handling](../level-05-validation-and-error-handling/lesson-01-input-validation.md)
4. 💻 **Reference**: Check `project/` folder

---

**Key Takeaways:**
- Always hash passwords (never store plain text)
- Use JWT for stateless authentication
- Middleware protects routes
- Role-based authorization adds security
- Never return passwords in responses
- Validate all input
- Use secure defaults

**Good luck! Happy coding! 🚀**
