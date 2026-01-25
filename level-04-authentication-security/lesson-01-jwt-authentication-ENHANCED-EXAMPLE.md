# Lesson 1: JWT Authentication (Enhanced Example)

> **This is an enhanced lesson template** demonstrating the level of detail, examples, and best practices that should be included in all lessons.

## What is JWT Authentication?

**JSON Web Tokens (JWT)** are a compact, URL-safe way to represent claims between two parties. In web applications, JWTs are commonly used for **stateless authentication** - meaning the server doesn't need to store session information.

### Why Use JWT?

**Advantages:**
- ✅ **Stateless**: No server-side session storage needed
- ✅ **Scalable**: Works across multiple servers without shared session storage
- ✅ **Self-contained**: Token includes user information (claims)
- ✅ **Cross-domain**: Works with APIs, mobile apps, and microservices
- ✅ **Standard**: Industry-standard format (RFC 7519)

**When to Use:**
- RESTful APIs
- Microservices architecture
- Single Page Applications (SPAs)
- Mobile applications
- Cross-domain authentication

**When NOT to Use:**
- ❌ When you need to revoke tokens immediately (requires token blacklist)
- ❌ When tokens contain sensitive data (they're base64 encoded, not encrypted)
- ❌ When you need server-side session control

### JWT Structure

A JWT consists of three parts separated by dots (`.`):

```text
header.payload.signature
```

**Example:**
```text
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjEyMywiZXhwIjoxNjE2MjM5MDIyfQ.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

1. **Header**: Algorithm and token type
2. **Payload**: Claims (user data, expiration, etc.)
3. **Signature**: Ensures token hasn't been tampered with

#### Visual: JWT Structure Breakdown

```mermaid
graph LR
    A[JWT Token] --> B[Header]
    A --> C[Payload]
    A --> D[Signature]
    
    B --> B1["Algorithm, Token Type"]
    C --> C1["User Claims, Expiration, Issuer"]
    D --> D1["HMAC Signature, Verification"]
```

## Prerequisites

Before implementing JWT authentication, ensure you have:

1. **Installed packages:**
   ```bash
   pnpm add jsonwebtoken
   pnpm add -D @types/jsonwebtoken
   ```

2. **Environment variable set:**
   ```env
   JWT_SECRET=your-super-secret-key-minimum-32-characters-long
   JWT_EXPIRES_IN=7d
   ```

   ⚠️ **Security Warning**: Never commit `JWT_SECRET` to version control. Use environment variables or secrets management.

## Basic Implementation

### Step 1: Generate JWT Tokens

When a user logs in successfully, generate a JWT token:

```typescript
// src/utils/jwt.ts
import jwt from 'jsonwebtoken';

interface TokenPayload {
  userId: number;
  email: string;
  role?: string;
}

/**
 * Generate a JWT token for a user
 * @param payload - User data to encode in the token
 * @returns JWT token string
 */
export function generateToken(payload: TokenPayload): string {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }

  // Sign the token with user data
  const token = jwt.sign(
    {
      userId: payload.userId,
      email: payload.email,
      role: payload.role || 'user', // Default role
    },
    secret,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || '7d', // Token expires in 7 days
      issuer: 'your-app-name', // Who issued the token
      audience: 'your-app-users', // Who the token is for
    }
  );

  return token;
}
```

**Key Points:**
- `jwt.sign()` creates a signed token
- The payload should NOT contain sensitive data (passwords, credit cards)
- `expiresIn` can be: `'1h'`, `'7d'`, `'30d'`, or seconds like `3600`
- Always validate `JWT_SECRET` exists before using it

### Step 2: Verify JWT Tokens

When a user makes an authenticated request, verify the token:

```typescript
// src/utils/jwt.ts (continued)

interface DecodedToken extends TokenPayload {
  iat: number; // Issued at (timestamp)
  exp: number; // Expiration (timestamp)
  iss?: string; // Issuer
  aud?: string; // Audience
}

/**
 * Verify and decode a JWT token
 * @param token - JWT token string
 * @returns Decoded token payload
 * @throws Error if token is invalid or expired
 */
export function verifyToken(token: string): DecodedToken {
  const secret = process.env.JWT_SECRET;
  
  if (!secret) {
    throw new Error('JWT_SECRET is not defined');
  }

  try {
    // Verify token signature and expiration
    const decoded = jwt.verify(token, secret, {
      issuer: 'your-app-name',
      audience: 'your-app-users',
    }) as DecodedToken;

    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token has expired');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Invalid token');
    }
    throw error;
  }
}
```

**Error Handling:**
- `TokenExpiredError`: Token has passed its expiration time
- `JsonWebTokenError`: Token is malformed or invalid
- `NotBeforeError`: Token is not yet valid (if `notBefore` claim is set)

### Step 3: Authentication Middleware

Create middleware to protect routes:

```typescript
// src/middleware/auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        userId: number;
        email: string;
        role: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 * Extracts token from Authorization header and verifies it
 */
export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  try {
    // Extract token from Authorization header
    // Format: "Bearer <token>"
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No authorization header provided',
      });
      return;
    }

    // Split "Bearer <token>" and get the token part
    const parts = authHeader.split(' ');
    
    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Invalid authorization header format. Expected: "Bearer <token>"',
      });
      return;
    }

    const token = parts[1];

    // Verify and decode the token
    const decoded = verifyToken(token);

    // Attach user information to request object
    // This makes it available in route handlers
    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      role: decoded.role || 'user',
    };

    // Continue to the next middleware or route handler
    next();
  } catch (error) {
    // Handle different error types
    if (error instanceof Error) {
      if (error.message === 'Token has expired') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Token has expired. Please log in again.',
        });
        return;
      }
      
      if (error.message === 'Invalid token') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or malformed token',
        });
        return;
      }
    }

    // Generic error response
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Authentication failed',
    });
  }
}
```

## Complete Login Flow Example

#### Visual: Authentication Flow

```mermaid
sequenceDiagram
    participant Client
    participant Server
    participant Database
    participant JWT
    
    Client->>Server: POST /api/auth/login (email, password)
    Server->>Database: Find user by email
    Database-->>Server: User data (with hashed password)
    Server->>Server: Verify password (bcrypt.compare)
    Server->>JWT: Generate token (jwt.sign)
    JWT-->>Server: JWT token
    Server-->>Client: Return token + user data
    Client->>Client: Store token (localStorage/cookie)
    
    Note over Client,Server: Subsequent Requests
    Client->>Server: GET /api/users/me (Authorization: Bearer token)
    Server->>JWT: Verify token (jwt.verify)
    JWT-->>Server: Decoded payload (userId, email, role)
    Server->>Database: Fetch user data
    Database-->>Server: User data
    Server-->>Client: Return user data
```

Here's a complete example of implementing login with JWT:

```typescript
// src/routes/auth.ts
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken } from '../utils/jwt';
import { prisma } from '../lib/prisma';

const router = Router();

/**
 * POST /api/auth/login
 * Authenticate user and return JWT token
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate input
    if (!email || !password) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required',
      });
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      // Don't reveal if email exists (security best practice)
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password',
      });
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Authentication Failed',
        message: 'Invalid email or password',
      });
    }

    // Generate JWT token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    // Return token (and optionally user data)
    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'An error occurred during login',
    });
  }
});

export default router;
```

## Using Authentication Middleware

#### Visual: Middleware Flow

```mermaid
graph TD
    A[Incoming Request] --> B{"Has Authorization Header?"}
    B -->|No| C["Return 401 Unauthorized"]
    B -->|Yes| D[Extract Token]
    D --> E{"Token Format Valid?"}
    E -->|No| C
    E -->|Yes| F["Verify Token jwt.verify"]
    F --> G{"Token Valid & Not Expired?"}
    G -->|No| H["Return 401 Invalid Token"]
    G -->|Yes| I["Attach User to req.user"]
    I --> J[Call next]
    J --> K[Route Handler]
```

Protect routes by applying the authentication middleware:

```typescript
// src/routes/users.ts
import { Router, Request, Response } from 'express';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

// All routes in this router require authentication
router.use(authenticate);

/**
 * GET /api/users/me
 * Get current user's profile
 */
router.get('/me', async (req: Request, res: Response) => {
  try {
    // req.user is available because of authenticate middleware
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

export default router;
```

## Advanced: Role-Based Authorization

#### Visual: Authorization Flow

```mermaid
graph TD
    A[Request with Token] --> B[Authenticate Middleware]
    B --> C{Token Valid?}
    C -->|No| D[401 Unauthorized]
    C -->|Yes| E[Authorize Middleware]
    E --> F{"User Role in Allowed Roles?"}
    F -->|No| G[403 Forbidden]
    F -->|Yes| H[Route Handler]
```

Extend the middleware to check user roles:

```typescript
// src/middleware/authorize.ts
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware to check if user has required role
 * Must be used after authenticate middleware
 */
export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // Ensure user is authenticated
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required',
      });
      return;
    }

    // Check if user's role is in allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Insufficient permissions',
      });
      return;
    }

    next();
  };
}
```

**Usage:**
```typescript
// Only admins can access this route
router.delete('/users/:id', authenticate, authorize('admin'), async (req, res) => {
  // Delete user logic
});
```

## Best Practices

### 1. Token Storage

#### Visual: Token Storage Comparison

```mermaid
graph TD
    A[Token Storage Options] --> B[HTTP-only Cookies]
    A --> C[localStorage]
    A --> D[Regular Cookies]
    
    B --> B1["✅ Most Secure; ❌ XSS Protected; ⚠️ CSRF Risk"]
    C --> C1["⚠️ XSS Vulnerable; ✅ Easy to Use; ✅ No CSRF"]
    D --> D1["❌ XSS Vulnerable; ❌ Not Recommended"]
```

**Client-Side Storage Options:**

✅ **Recommended: HTTP-only Cookies**
```typescript
// Set token in HTTP-only cookie (more secure)
res.cookie('token', token, {
  httpOnly: true, // Prevents JavaScript access
  secure: process.env.NODE_ENV === 'production', // HTTPS only in production
  sameSite: 'strict', // CSRF protection
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
});
```

⚠️ **Acceptable: localStorage/sessionStorage** (for SPAs)
- Easier to implement
- Less secure (vulnerable to XSS)
- Must implement CSRF protection

❌ **Never: Regular cookies without httpOnly**
- Vulnerable to XSS attacks

### 2. Token Expiration

**Recommended Expiration Times:**
- **Access Tokens**: 15 minutes to 1 hour (short-lived)
- **Refresh Tokens**: 7-30 days (long-lived, stored securely)

**Implementation:**
```typescript
// Short-lived access token
const accessToken = jwt.sign(payload, secret, { expiresIn: '15m' });

// Long-lived refresh token (stored in database)
const refreshToken = jwt.sign(payload, secret, { expiresIn: '30d' });
```

### 3. Secret Management

**DO:**
- ✅ Use strong, random secrets (minimum 32 characters)
- ✅ Store secrets in environment variables
- ✅ Use different secrets for different environments
- ✅ Rotate secrets periodically

**DON'T:**
- ❌ Hardcode secrets in code
- ❌ Commit secrets to version control
- ❌ Use weak secrets like "secret" or "password"
- ❌ Share secrets between production and development

**Generate Strong Secret:**
```bash
# Generate a random 64-character secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 4. Payload Size

**Keep payloads small:**
- ✅ Only include necessary user data (userId, email, role)
- ✅ Don't include sensitive data (passwords, credit cards)
- ✅ Don't include large objects

**Bad Example:**
```typescript
// ❌ Too much data in token
jwt.sign({
  userId: user.id,
  email: user.email,
  fullUserProfile: user, // Entire user object - TOO LARGE
  preferences: user.preferences, // Large nested object
}, secret);
```

**Good Example:**
```typescript
// ✅ Minimal, essential data only
jwt.sign({
  userId: user.id,
  email: user.email,
  role: user.role,
}, secret);
```

## Common Pitfalls and Solutions

### Pitfall 1: Not Handling Token Expiration

**Problem:**
```typescript
// ❌ No expiration handling
const decoded = jwt.verify(token, secret);
```

**Solution:**
```typescript
// ✅ Proper error handling
try {
  const decoded = jwt.verify(token, secret);
} catch (error) {
  if (error instanceof jwt.TokenExpiredError) {
    // Return 401, client should refresh token
  }
}
```

### Pitfall 2: Storing Sensitive Data in Token

**Problem:**
```typescript
// ❌ Password in token (NEVER DO THIS)
jwt.sign({ userId: user.id, password: user.password }, secret);
```

**Solution:**
```typescript
// ✅ Only non-sensitive identifiers
jwt.sign({ userId: user.id, email: user.email }, secret);
```

### Pitfall 3: Not Validating Token Format

**Problem:**
```typescript
// ❌ Assumes token is always valid format
const token = req.headers.authorization.split(' ')[1];
```

**Solution:**
```typescript
// ✅ Validate format first
const authHeader = req.headers.authorization;
if (!authHeader || !authHeader.startsWith('Bearer ')) {
  return res.status(401).json({ error: 'Invalid authorization header' });
}
const token = authHeader.split(' ')[1];
```

### Pitfall 4: Synchronous Token Verification in Async Routes

**Problem:**
```typescript
// ❌ Blocking operation
router.get('/protected', (req, res) => {
  const decoded = jwt.verify(token, secret); // Blocks event loop
  // ...
});
```

**Solution:**
```typescript
// ✅ Use async/await with try-catch
router.get('/protected', async (req, res) => {
  try {
    const decoded = await verifyToken(token); // Non-blocking
    // ...
  } catch (error) {
    // Handle error
  }
});
```

## Troubleshooting

### Issue: "JWT_SECRET is not defined"

**Symptoms:**
```text
Error: JWT_SECRET is not defined in environment variables
```

**Solutions:**
1. Check `.env` file exists and contains `JWT_SECRET`
2. Verify environment variables are loaded (use `dotenv` package)
3. Restart the server after adding environment variables

```typescript
// Ensure dotenv is configured at the top of your entry file
import dotenv from 'dotenv';
dotenv.config();
```

### Issue: "Token has expired" immediately

**Symptoms:**
- Token expires right after creation
- `TokenExpiredError` on first use

**Solutions:**
1. Check system clock is synchronized
2. Verify `expiresIn` format is correct (`'7d'`, `'1h'`, not `'7 days'`)
3. Check token was created with correct expiration

### Issue: "Invalid token" error

**Symptoms:**
- Token verification always fails
- `JsonWebTokenError` on valid tokens

**Solutions:**
1. Verify `JWT_SECRET` matches between token creation and verification
2. Check token wasn't modified (signature validation)
3. Ensure token format is correct (three parts separated by dots)
4. Check for extra whitespace in token string

### Issue: CORS errors with tokens

**Symptoms:**
- Token sent but not received by server
- CORS preflight fails

**Solutions:**
```typescript
// Configure CORS to allow Authorization header
app.use(cors({
  origin: process.env.CORS_ORIGIN,
  credentials: true, // Allow cookies
  exposedHeaders: ['Authorization'], // Expose custom headers
}));
```

## Security Considerations

### 1. HTTPS Only in Production

Always use HTTPS in production to prevent token interception:

```typescript
// Set secure flag in production
res.cookie('token', token, {
  secure: process.env.NODE_ENV === 'production',
});
```

### 2. Token Rotation

Implement token rotation for enhanced security:

```typescript
// Issue new token before old one expires
if (decoded.exp - Date.now() / 1000 < 3600) { // Less than 1 hour left
  const newToken = generateToken({ userId: decoded.userId });
  res.setHeader('X-New-Token', newToken);
}
```

### 3. Rate Limiting

Protect login endpoints from brute force attacks:

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again later',
});

router.post('/login', loginLimiter, async (req, res) => {
  // Login logic
});
```

## Real-World Example: Complete Auth System

#### Visual: Complete Authentication Architecture

```mermaid
graph TB
    subgraph Client["Client Application"]
        A[Login Form] --> B[Register Form]
        B --> C[Protected Routes]
    end
    
    subgraph Server["Express Server"]
        D[Auth Routes] --> E[Auth Middleware]
        E --> F[Protected Routes]
        D --> G[Rate Limiter]
    end
    
    subgraph Security["Security Layer"]
        H[JWT Generation] --> I[JWT Verification]
        I --> J[Password Hashing]
    end
    
    subgraph Database["Database"]
        K[User Table]
    end
    
    A -->|POST /login| D
    B -->|POST /register| D
    C -->|GET /me| F
    D --> H
    E --> I
    D --> J
    D --> K
    F --> K
    
    style D fill:#e1f5ff
    style E fill:#fff4e1
    style H fill:#e8f5e9
    style I fill:#e8f5e9
    style K fill:#f3e5f5
```

Here's a complete authentication system with login, registration, and protected routes:

```typescript
// src/routes/auth.ts (Complete Example)
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { generateToken, verifyToken } from '../utils/jwt';
import { authenticate } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import rateLimit from 'express-rate-limit';

const router = Router();

// Rate limiting for auth endpoints
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
});

/**
 * POST /api/auth/register
 * Register a new user
 */
router.post('/register', authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password, name } = req.body;

    // Validate input
    if (!email || !password || !name) {
      return res.status(400).json({
        error: 'Validation Error',
        message: 'Email, password, and name are required',
      });
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({
        error: 'Conflict',
        message: 'User with this email already exists',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'user',
      },
    });

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

/**
 * POST /api/auth/login
 * Login existing user
 */
router.post('/login', authLimiter, async (req: Request, res: Response) => {
  // ... (login logic from earlier example)
});

/**
 * GET /api/auth/me
 * Get current authenticated user
 */
router.get('/me', authenticate, async (req: Request, res: Response) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      return res.status(404).json({
        error: 'Not Found',
        message: 'User not found',
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
    });
  }
});

export default router;
```

## Testing Your Implementation

### Manual Testing with cURL

```bash
# Register a user
curl -X POST http://localhost:3001/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123","name":"Test User"}'

# Login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use token to access protected route
curl http://localhost:3001/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Next Steps

1. ✅ Implement JWT authentication in your login route
2. ✅ Create authentication middleware
3. ✅ Protect your API routes
4. 📖 Learn about [Password Hashing](./lesson-02-password-hashing.md)
5. 📖 Learn about [Authorization](./lesson-03-authorization.md)
6. 💻 Complete the [exercises](./exercises-04.md)

## Additional Resources

- [JWT.io](https://jwt.io/) - Debug and decode JWTs
- [RFC 7519](https://tools.ietf.org/html/rfc7519) - JWT Specification
- [OWASP JWT Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)

---

**Key Takeaways:**
- JWT provides stateless authentication
- Always validate tokens and handle errors
- Never store sensitive data in tokens
- Use strong secrets and proper expiration
- Implement rate limiting on auth endpoints
- Use HTTPS in production
