# Exercises 01: Express Basics

## Learning Objectives

By completing these exercises, you will:
- ✅ Set up a basic Express.js server
- ✅ Create RESTful API routes
- ✅ Implement middleware for common tasks
- ✅ Organize routes in a scalable structure
- ✅ Understand Express request/response cycle
- ✅ Practice TypeScript with Express

## Before You Start

**Prerequisites:**
- Node.js 22+ LTS installed
- pnpm package manager installed
- TypeScript knowledge (from fs-course-typescript)
- Express.js project set up (see [LEARNING-GUIDE.md](../../LEARNING-GUIDE.md))

**Setup:**
1. Navigate to `fs-course-backend/level-01-express-basics/`
2. Ensure your `project/` directory is set up with Express
3. All exercises should be created in the `project/src/` directory

---

## Exercise 1: Basic Server

**Objective:** Create your first Express.js server with a health check endpoint.

**Instructions:**
Create a file `project/src/server.ts` that:

1. Imports Express
2. Creates an Express application instance
3. Defines a GET `/health` endpoint that returns `{ status: "ok" }`
4. Starts the server on port 3001
5. Logs a message when the server starts

**Expected Code Structure:**
```typescript
// project/src/server.ts
import express, { Request, Response } from 'express';

const app = express();
const PORT = 3001;

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Verification Steps:**
1. Run the server: `cd project && pnpm dev`
2. Test the endpoint:
   ```bash
   curl http://localhost:3001/health
   # Or visit http://localhost:3001/health in your browser
   ```
3. Expected response: `{"status":"ok"}`

**Expected Output:**
```json
{
  "status": "ok"
}
```

**Hints:**
- Use `express()` to create the app instance
- Use `app.get()` for GET routes
- Use `res.json()` to send JSON responses
- Use `app.listen()` to start the server
- The callback receives `req` (Request) and `res` (Response) objects

**Common Mistakes:**
- ❌ Forgetting to import Express: `import express from 'express'`
- ❌ Not typing the request/response: Use `Request` and `Response` from `express`
- ❌ Using `res.send()` instead of `res.json()` for JSON (both work, but `json()` is clearer)
- ❌ Not calling `app.listen()` - the server won't start!

**Testing:**
```bash
# Start server
cd project
pnpm dev

# In another terminal, test the endpoint
curl http://localhost:3001/health
# Expected: {"status":"ok"}
```

**File:** `project/src/server.ts`

---

## Exercise 2: User Routes

**Objective:** Create RESTful routes for user management.

**Instructions:**
Create user routes with the following endpoints:

1. **GET /users** - Returns a list of users (array)
2. **GET /users/:id** - Returns a specific user by ID
3. **POST /users** - Creates a new user

**Step-by-Step:**

1. Create `project/src/routes/users.ts`:
```typescript
// project/src/routes/users.ts
import { Router, Request, Response } from 'express';

const router = Router();

// In-memory storage (for this exercise)
let users: Array<{ id: number; name: string; email: string }> = [
  { id: 1, name: 'Alice', email: 'alice@example.com' },
  { id: 2, name: 'Bob', email: 'bob@example.com' },
];

// GET /users - Get all users
router.get('/', (req: Request, res: Response) => {
  res.json(users);
});

// GET /users/:id - Get user by ID
router.get('/:id', (req: Request, res: Response) => {
  const id = parseInt(req.params.id, 10);
  const user = users.find(u => u.id === id);
  
  if (!user) {
    return res.status(404).json({ error: 'User not found' });
  }
  
  res.json(user);
});

// POST /users - Create new user
router.post('/', (req: Request, res: Response) => {
  const { name, email } = req.body;
  
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  
  const newUser = {
    id: users.length + 1,
    name,
    email,
  };
  
  users.push(newUser);
  res.status(201).json(newUser);
});

export default router;
```

2. Update `project/src/server.ts` to use the router:
```typescript
// project/src/server.ts
import express from 'express';
import usersRouter from './routes/users';

const app = express();
const PORT = 3001;

// Middleware to parse JSON (needed for POST requests)
app.use(express.json());

// Mount user routes
app.use('/users', usersRouter);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Verification Steps:**
1. Test GET /users:
   ```bash
   curl http://localhost:3001/users
   # Expected: [{"id":1,"name":"Alice","email":"alice@example.com"},...]
   ```

2. Test GET /users/:id:
   ```bash
   curl http://localhost:3001/users/1
   # Expected: {"id":1,"name":"Alice","email":"alice@example.com"}
   
   curl http://localhost:3001/users/999
   # Expected: {"error":"User not found"} with 404 status
   ```

3. Test POST /users:
   ```bash
   curl -X POST http://localhost:3001/users \
     -H "Content-Type: application/json" \
     -d '{"name":"Charlie","email":"charlie@example.com"}'
   # Expected: {"id":3,"name":"Charlie","email":"charlie@example.com"} with 201 status
   ```

**Expected Behaviors:**
- GET /users returns all users
- GET /users/:id returns specific user or 404
- POST /users creates a new user and returns it with 201 status
- POST /users with missing fields returns 400 error

**Hints:**
- Use `Router()` to create a router instance
- Route parameters are in `req.params`
- Request body is in `req.body` (requires `express.json()` middleware)
- Use appropriate HTTP status codes (200, 201, 404, 400)
- Export the router as default

**Common Mistakes:**
- ❌ Forgetting `app.use(express.json())` - POST body won't be parsed
- ❌ Not converting `req.params.id` to number (it's a string by default)
- ❌ Not handling missing users (should return 404, not crash)
- ❌ Not validating request body (should return 400 for invalid data)

**File:** `project/src/routes/users.ts` and update `project/src/server.ts`

---

## Exercise 3: Middleware

**Objective:** Implement common middleware for Express applications.

**Instructions:**
Create middleware for:
1. JSON body parsing
2. CORS (Cross-Origin Resource Sharing)
3. Request logging
4. Error handling

**Step-by-Step:**

1. Create `project/src/middleware/index.ts`:
```typescript
// project/src/middleware/index.ts
import { Request, Response, NextFunction } from 'express';
import express from 'express';
import cors from 'cors';

// JSON parser middleware
export const jsonParser = express.json();

// CORS middleware
export const corsMiddleware = cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
  credentials: true,
});

// Request logger middleware
export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.path}`);
  next();
};

// Error handling middleware (must be last)
export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  console.error('Error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
};
```

2. Update `project/src/server.ts` to use middleware:
```typescript
// project/src/server.ts
import express from 'express';
import usersRouter from './routes/users';
import {
  jsonParser,
  corsMiddleware,
  requestLogger,
  errorHandler,
} from './middleware';

const app = express();
const PORT = 3001;

// Apply middleware (order matters!)
app.use(corsMiddleware);      // CORS first
app.use(jsonParser);          // JSON parsing
app.use(requestLogger);       // Logging

// Routes
app.use('/users', usersRouter);
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

// Error handler (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

**Verification Steps:**
1. Install CORS package:
   ```bash
   cd project
   pnpm add cors
   pnpm add -D @types/cors
   ```

2. Test logging - make a request and check console:
   ```bash
   curl http://localhost:3001/health
   # Console should show: [2024-01-01T12:00:00.000Z] GET /health
   ```

3. Test CORS - make a request from browser console:
   ```javascript
   fetch('http://localhost:3001/health')
     .then(r => r.json())
     .then(console.log);
   ```

4. Test error handling - create an error route:
   ```typescript
   app.get('/error', () => {
     throw new Error('Test error');
   });
   ```
   Then test: `curl http://localhost:3001/error`
   Expected: `{"error":"Internal server error"}` with 500 status

**Expected Behaviors:**
- All requests are logged with timestamp, method, and path
- CORS headers are included in responses
- JSON bodies are parsed automatically
- Errors are caught and return proper error responses

**Hints:**
- Middleware order matters - apply in logical sequence
- Error handler must be last (after all routes)
- Use `next()` to pass control to next middleware
- Error handler has 4 parameters (err, req, res, next)

**Common Mistakes:**
- ❌ Wrong middleware order - error handler must be last
- ❌ Forgetting to call `next()` - request will hang
- ❌ Not installing CORS package
- ❌ Error handler with wrong signature (must have 4 parameters)

**File:** `project/src/middleware/index.ts` and update `project/src/server.ts`

---

## Exercise 4: Router Organization

**Objective:** Organize routes in a scalable, maintainable structure.

**Instructions:**
Organize your routes by:
1. Creating a routes folder structure
2. Separating route files by resource
3. Mounting routes in the main server file

**Step-by-Step:**

1. Create route files structure:
```
project/src/
├── routes/
│   ├── index.ts          # Main router that combines all routes
│   ├── users.ts          # User routes
│   └── health.ts         # Health check route
└── server.ts              # Main server file
```

2. Create `project/src/routes/health.ts`:
```typescript
// project/src/routes/health.ts
import { Router, Request, Response } from 'express';

const router = Router();

router.get('/', (req: Request, res: Response) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

export default router;
```

3. Update `project/src/routes/users.ts` (from Exercise 2)

4. Create `project/src/routes/index.ts` to combine all routes:
```typescript
// project/src/routes/index.ts
import { Router } from 'express';
import usersRouter from './users';
import healthRouter from './health';

const router = Router();

// Mount all routes
router.use('/health', healthRouter);
router.use('/users', usersRouter);

export default router;
```

5. Update `project/src/server.ts`:
```typescript
// project/src/server.ts
import express from 'express';
import routes from './routes';
import {
  jsonParser,
  corsMiddleware,
  requestLogger,
  errorHandler,
} from './middleware';

const app = express();
const PORT = 3001;

// Middleware
app.use(corsMiddleware);
app.use(jsonParser);
app.use(requestLogger);

// Mount all routes
app.use('/api', routes); // All routes prefixed with /api

// Error handler
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/api/health`);
  console.log(`Users API: http://localhost:${PORT}/api/users`);
});
```

**Verification Steps:**
1. Test health endpoint:
   ```bash
   curl http://localhost:3001/api/health
   # Expected: {"status":"ok","timestamp":"2024-01-01T12:00:00.000Z"}
   ```

2. Test users endpoint:
   ```bash
   curl http://localhost:3001/api/users
   # Expected: Array of users
   ```

3. Verify route organization:
   - All routes are in separate files
   - Routes are combined in `routes/index.ts`
   - Main server is clean and organized

**Expected Structure:**
```
/api/health          → Health check
/api/users           → List users
/api/users/:id       → Get user by ID
/api/users (POST)    → Create user
```

**Hints:**
- Use route prefix (`/api`) to namespace all API routes
- Keep route files focused on single resources
- Export routers as default for cleaner imports
- Use `router.use()` to mount sub-routers

**Common Mistakes:**
- ❌ Not using route prefixes - can cause conflicts
- ❌ Mixing multiple resources in one route file
- ❌ Forgetting to export routers
- ❌ Circular dependencies between route files

**Benefits of This Structure:**
- ✅ Easy to add new routes
- ✅ Clear separation of concerns
- ✅ Scalable for large applications
- ✅ Easy to test individual routes

**File:** `project/src/routes/index.ts`, `project/src/routes/health.ts`, and update existing files

---

## Running Exercises

### Start Development Server

```bash
cd project
pnpm dev
```

The server should start on `http://localhost:3001`

### Test Endpoints

**Health Check:**
```bash
curl http://localhost:3001/api/health
```

**Get All Users:**
```bash
curl http://localhost:3001/api/users
```

**Get User by ID:**
```bash
curl http://localhost:3001/api/users/1
```

**Create User:**
```bash
curl -X POST http://localhost:3001/api/users \
  -H "Content-Type: application/json" \
  -d '{"name":"John Doe","email":"john@example.com"}'
```

## Verification Checklist

After completing all exercises, verify:

- [ ] Server starts without errors
- [ ] Health endpoint returns `{"status":"ok"}`
- [ ] GET /api/users returns array of users
- [ ] GET /api/users/:id returns specific user or 404
- [ ] POST /api/users creates new user
- [ ] Request logging works (check console)
- [ ] CORS headers are present in responses
- [ ] Error handling works (test with invalid requests)
- [ ] All routes are organized in separate files

## Troubleshooting

### Issue: "Cannot find module 'express'"

**Solution:**
```bash
cd project
pnpm install
# Or: pnpm add express
```

### Issue: "Cannot find module 'cors'"

**Solution:**
```bash
cd project
pnpm add cors
pnpm add -D @types/cors
```

### Issue: "req.body is undefined"

**Solution:**
- Ensure `app.use(express.json())` is called BEFORE routes
- Check that Content-Type header is `application/json`
- Verify middleware order is correct

### Issue: "CORS errors in browser"

**Solution:**
- Check CORS middleware is applied
- Verify `origin` in CORS config matches your frontend URL
- Ensure `credentials: true` if using cookies

### Issue: "Route not found (404)"

**Solution:**
- Check route path matches exactly (case-sensitive)
- Verify route is mounted correctly
- Check route prefix (`/api`) if using one
- Ensure route handler calls `res.json()` or `res.send()`

### Issue: "Port 3001 already in use"

**Solution:**
```bash
# Find process using port 3001
lsof -i :3001  # macOS/Linux
netstat -ano | findstr :3001  # Windows

# Kill the process or use a different port
const PORT = process.env.PORT || 3002;
```

## Next Steps

After completing these exercises:

1. ✅ **Review**: Understand how Express routing works
2. ✅ **Experiment**: Add more routes (posts, comments, etc.)
3. ✅ **Practice**: Add validation middleware
4. 📖 **Continue**: Move to [Level 2: Database Integration](../level-02-database-integration/lesson-01-prisma-setup.md)
5. 💻 **Solutions**: Check the `project/` folder for reference implementation

## Additional Resources

- [Express.js Documentation](https://expressjs.com/)
- [Express Routing Guide](https://expressjs.com/en/guide/routing.html)
- [Express Middleware](https://expressjs.com/en/guide/using-middleware.html)

---

**Key Takeaways:**
- Express apps are created with `express()`
- Routes are defined with `app.get()`, `app.post()`, etc.
- Middleware processes requests before they reach routes
- Routers help organize routes into separate files
- Error handling middleware should be last
- Always use TypeScript types for request/response objects

**Good luck! Happy coding! 🚀**
