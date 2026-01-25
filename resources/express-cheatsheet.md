# Express.js Cheatsheet

## Basic Server

```typescript
import express from 'express';
const app = express();
app.listen(3001);
```

## Routes

```typescript
app.get('/users', handler);
app.post('/users', handler);
app.put('/users/:id', handler);
app.delete('/users/:id', handler);
```

## Middleware

```typescript
app.use(express.json());
app.use(cors());
app.use(helmet());
```

## Error Handling

```typescript
app.use((err, req, res, next) => {
  res.status(500).json({ error: err.message });
});
```
