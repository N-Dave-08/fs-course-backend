# Backend Course Setup Guide

Complete setup instructions for the Express.js backend development course.

## Prerequisites

Before starting, ensure you have:

1. **Node.js 22+ LTS** installed
   - Check: `node --version`
   - Download: [nodejs.org](https://nodejs.org/)

2. **pnpm** package manager installed
   - Check: `pnpm --version`
   - Install: `npm install -g pnpm` or `corepack enable`

3. **TypeScript Knowledge**
   - Complete [fs-course-typescript](../fs-course-typescript/) first
   - This course requires TypeScript fundamentals

4. **PostgreSQL** (for database)
   - Install: [postgresql.org](https://www.postgresql.org/download/)
   - Or use Docker: `docker run -d -p 5432:5432 postgres:16`

5. **Code Editor** (VS Code recommended)
   - Download: [code.visualstudio.com](https://code.visualstudio.com/)

## Initial Setup

### Step 1: Navigate to Course Directory

```bash
cd fs-course-backend
```

### Step 2: Create Project Directory

```bash
mkdir project
cd project
```

### Step 3: Initialize Package.json

```bash
pnpm init
```

Accept defaults or customize as needed.

### Step 4: Install Dependencies

Install production dependencies:

```bash
pnpm add express@^4.21.0 @prisma/client@^7.3.0 helmet cors express-rate-limit zod bcrypt jsonwebtoken
```

Install development dependencies:

```bash
pnpm add -D typescript@^5.7.0 @types/express@^4.17.0 @types/node@^22.0.0 ts-node@^10.9.0 prisma@^7.3.0 @types/bcrypt@^5.0.0 @types/jsonwebtoken@^9.0.0
```

### Step 5: Initialize Prisma

```bash
npx prisma init
```

This creates:
- `prisma/schema.prisma` - Database schema
- `.env` - Environment variables

### Step 6: Configure TypeScript

Create `tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "declaration": true,
    "sourceMap": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

### Step 7: Create Project Structure

```bash
mkdir -p src/{routes,controllers,middleware,services,types,utils,config}
```

### Step 8: Configure Environment Variables

Edit `.env`:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/mydb?schema=public"
JWT_SECRET="your-secret-key-change-in-production"
PORT=3001
NODE_ENV=development
```

### Step 9: Create Basic Server

Create `src/server.ts`:

```typescript
import express from 'express';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(express.json());

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
```

### Step 10: Add Scripts to package.json

```json
{
  "scripts": {
    "dev": "ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "prisma:generate": "prisma generate",
    "prisma:migrate": "prisma migrate dev"
  }
}
```

### Step 11: Verify Setup

```bash
# Generate Prisma Client
pnpm prisma:generate

# Run server
pnpm dev
```

Visit [http://localhost:3001/health](http://localhost:3001/health) - you should see `{"status":"ok"}`.

## Workflow

### Running Development Server

```bash
pnpm dev
```

### Building for Production

```bash
pnpm build
pnpm start
```

### Database Migrations

```bash
# Create migration
pnpm prisma:migrate

# Generate Prisma Client
pnpm prisma:generate
```

## Troubleshooting

### Issue: Port already in use

**Solution:** Change PORT in `.env` or kill process using port 3001

### Issue: Prisma connection error

**Solution:** 
- Check PostgreSQL is running
- Verify DATABASE_URL in `.env`
- Test connection: `npx prisma db pull`

### Issue: TypeScript errors

**Solution:**
- Run `pnpm install` to ensure all types installed
- Check `tsconfig.json` configuration
- Verify file paths match `rootDir` setting

## Next Steps

1. ✅ Verify setup by running `pnpm dev` and visiting /health
2. 📖 Start with [Level 1: Express Basics](./level-01-express-basics/lesson-01-introduction.md)
3. 💻 Complete exercises for each level
4. 📚 Explore the [project/](./project/) folder for reference

Happy coding! 🚀
