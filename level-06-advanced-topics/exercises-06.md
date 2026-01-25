# Exercises 06: Advanced Topics

## Learning Objectives

By completing these exercises, you will:
- ✅ Implement file upload functionality
- ✅ Add rate limiting to API
- ✅ Set up comprehensive logging
- ✅ Secure file storage
- ✅ Monitor API usage
- ✅ Practice production-ready features

## Before You Start

**Prerequisites:**
- Express.js advanced knowledge
- Understanding of middleware
- File system knowledge
- Production deployment concepts

**Setup:**
1. Navigate to `fs-course-backend/level-06-advanced-topics/`
2. Install packages: `pnpm add multer express-rate-limit winston morgan`
3. All exercises should be created in `project/src/`

**Windows note (PowerShell):**
PowerShell often aliases `curl` to `Invoke-WebRequest`. Use `curl.exe` if your curl commands behave unexpectedly.

---

## Exercise 1: File Upload

**Objective:** Create secure file upload endpoint.

**Instructions:**
Create `project/src/routes/upload.ts` that:
1. Accepts image files
2. Validates file type and size
3. Stores files securely

**Expected Code Structure:**
```typescript
// project/src/routes/upload.ts
import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = Router();

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
  fileFilter,
});

// POST /api/upload
router.post('/', upload.single('image'), (req: Request, res: Response) => {
  if (!req.file) {
    return res.status(400).json({
      success: false,
      error: 'No file uploaded',
    });
  }

  res.json({
    success: true,
    data: {
      filename: req.file.filename,
      originalName: req.file.originalname,
      size: req.file.size,
      path: req.file.path,
    },
  });
});

export default router;
```

**Verification:**
- File uploads work
- Validation works
- Files stored securely
- Size limits enforced

**File:** `project/src/routes/upload.ts`

---

## Exercise 2: Rate Limiting

**Objective:** Add rate limiting to protect API.

**Instructions:**
Create `project/src/middleware/rateLimit.ts`:
1. General API rate limit
2. Stricter limit for auth endpoints
3. Proper error messages

**Expected Code Structure:**
```typescript
// project/src/middleware/rateLimit.ts
import rateLimit from 'express-rate-limit';

// General API rate limit
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Stricter limit for auth endpoints
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Too many login attempts, please try again later.',
  },
  skipSuccessfulRequests: true, // Don't count successful requests
});
```

**Usage:**
```typescript
// Apply to routes
import { apiLimiter, authLimiter } from '../middleware/rateLimit';

// General API limit
app.use('/api', apiLimiter);

// Auth routes with stricter limit
router.post('/login', authLimiter, loginHandler);
router.post('/register', authLimiter, registerHandler);
```

**Verification:**
- Rate limits work
- Different limits for different routes
- Error messages clear
- Limits reset after window

**File:** `project/src/middleware/rateLimit.ts`

---

## Exercise 3: Logging

**Objective:** Set up comprehensive logging.

**Instructions:**
Create `project/src/config/logger.ts`:
1. Winston logger configuration
2. Request logging with Morgan
3. Error logging

**Expected Code Structure:**
```typescript
// project/src/config/logger.ts
import winston from 'winston';
import morgan from 'morgan';

// Winston logger
export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  defaultMeta: { service: 'api' },
  transports: [
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' }),
  ],
});

// Console logging in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      winston.format.simple()
    ),
  }));
}

// Morgan request logger
export const requestLogger = morgan('combined', {
  stream: {
    write: (message: string) => {
      logger.info(message.trim());
    },
  },
});
```

**Usage:**
```typescript
// In server.ts
import { logger, requestLogger } from './config/logger';

app.use(requestLogger);

// Log errors
logger.error('Error occurred', { error: err });
```

**Verification:**
- Logs written to files
- Console logging in dev
- Request logging works
- Error logging works

**File:** `project/src/config/logger.ts`

---

## Running Exercises

### Install Packages

```bash
cd project
pnpm add multer express-rate-limit winston morgan
pnpm add -D @types/multer @types/morgan
```

### Test File Upload

```bash
curl.exe -X POST http://localhost:3001/api/upload -F "image=@/path/to/image.jpg"
```

## Verification Checklist

- [ ] File upload works
- [ ] Rate limiting works
- [ ] Logging works
- [ ] All features secure
- [ ] Error handling works

## Next Steps

1. ✅ **Review**: Understand advanced topics
2. ✅ **Experiment**: Add more features
3. 📖 **Complete**: Review all backend levels
4. 💻 **Reference**: Check `project/` folder

---

**Key Takeaways:**
- File uploads need validation
- Rate limiting protects APIs
- Logging is essential for production
- Always validate file types and sizes
- Use appropriate storage strategies
- Monitor API usage

**Good luck! Happy coding! 🚀**
