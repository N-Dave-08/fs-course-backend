# Lesson 1: File Uploads (Long-form Enhanced)

## Table of Contents

- Multipart vs JSON requests
- Multer basics + validation
- Storage strategies (disk vs memory vs object storage)
- Troubleshooting
- Advanced patterns: direct-to-S3, streaming, scanning, and secure serving

## Learning Objectives

By the end of this lesson, you will be able to:
- Accept file uploads in Express using Multer
- Understand multipart/form-data vs JSON requests
- Validate uploads (size, mime type) and return safe errors
- Choose storage strategies (disk vs memory vs object storage like S3)
- Recognize common pitfalls (trusting mimetype, storing user filenames, unbounded uploads)

## Why File Uploads Matter

Many real apps need uploads:
- profile pictures
- documents
- attachments

Uploads introduce new security and reliability risks, so they must be handled carefully.

```mermaid
flowchart LR
  client[Client] --> multipart[MultipartUpload]
  multipart --> multer[MulterMiddleware]
  multer --> validate[Validate]
  validate --> store[StoreFile]
  store --> response[Response]
```

## Using Multer (Basic)

```typescript
import multer from "multer";

const upload = multer({ dest: "uploads/" });

app.post("/upload", upload.single("file"), (req, res) => {
  res.json({ file: req.file });
});
```

### What `upload.single("file")` means

It expects a multipart form with a field named `file` containing one uploaded file.

## File Validation (Size + Type)

```typescript
import multer from "multer";

const upload = multer({
  dest: "uploads/",
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only images allowed"));
    }
  },
});
```

### Security note: mimetype is not enough

`file.mimetype` is useful, but it’s not a perfect guarantee. For high-security needs, you should:
- inspect file signatures (“magic bytes”)
- scan uploads (antivirus)
- store outside the web root

## Storage Strategies (Real Apps)

### Disk storage (simple)

- fast to get started
- can be hard to scale across multiple servers

### Memory storage (careful)

- useful for streaming to S3
- risky if you allow large uploads (memory pressure)

### Object storage (recommended for production)

- S3-compatible storage scales and is durable
- app servers stay stateless

## Real-World Scenario: Profile Photo Upload

Typical pattern:
1. validate file size/type
2. store file (S3)
3. save file URL in DB
4. return updated user profile

## Best Practices

### 1) Enforce upload limits

Always set size limits and reject unexpected types.

### 2) Don’t trust filenames from users

Generate your own safe filenames/IDs.

### 3) Keep uploads out of the public web root

Serve via controlled routes or signed URLs.

## Common Pitfalls and Solutions

### Pitfall 1: No size limits

**Problem:** Users can upload huge files and exhaust disk/memory.

**Solution:** Set `limits.fileSize` and reject early.

### Pitfall 2: Trusting mimetype alone

**Problem:** Attackers can spoof `mimetype`.

**Solution:** Validate signatures/scan files for sensitive use cases.

### Pitfall 3: Storing on disk in a multi-server deployment

**Problem:** Files “disappear” because requests hit different servers.

**Solution:** Use shared storage (S3) or a shared volume.

## Troubleshooting

### Issue: `req.file` is undefined

**Symptoms:**
- upload route returns no file

**Solutions:**
1. Confirm the request is `multipart/form-data`.
2. Confirm the field name matches `upload.single("file")`.

### Issue: "File too large"

**Symptoms:**
- Multer rejects large uploads

**Solutions:**
1. Increase `limits.fileSize` carefully, or enforce product rules.
2. Prefer direct-to-S3 uploads for large files (advanced).

---

## Advanced Upload Patterns (Reference)

### 1) Direct-to-object-storage uploads (recommended at scale)

In production, you often avoid sending large files through your API servers:
- backend issues a signed URL (or temporary credentials)
- client uploads directly to S3-compatible storage
- backend stores metadata + URL

Benefits:
- app servers stay stateless
- fewer timeouts and less memory/disk pressure

### 2) Streaming uploads (reduce memory usage)

If you must handle uploads in your server, prefer streaming pipelines rather than buffering large files in memory.

### 3) Validate by “content sniffing”, not just mimetype

`file.mimetype` can be spoofed.

For high-sensitivity uploads:
- inspect file signatures (“magic bytes”)
- enforce allowed formats
- scan with antivirus

### 4) Secure filenames and paths

Never trust user filenames for storage paths.
Generate your own ids/filenames and store outside the web root.

### 5) Serving uploads safely

Common safe patterns:
- private bucket + signed download URLs
- authenticated download route (checks authz before streaming)

Avoid serving raw upload directories directly from the server.

### 6) Rate limit uploads and protect expensive processing

Uploads can be abused:
- set size limits
- rate limit upload endpoints
- offload image processing to background jobs if needed

## Next Steps

Now that you can handle uploads safely:

1. ✅ **Practice**: Add an image upload endpoint with size and type validation
2. ✅ **Experiment**: Store uploaded metadata (filename/size) in the database
3. 📖 **Next Lesson**: Learn about [Rate Limiting](./lesson-02-rate-limiting.md)
4. 💻 **Complete Exercises**: Work through [Exercises 06](./exercises-06.md)

## Additional Resources

- [Multer Docs](https://github.com/expressjs/multer)
- [OWASP: File Upload Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/File_Upload_Cheat_Sheet.html)

---

**Key Takeaways:**
- Use Multer to accept multipart uploads, and validate size/type.
- Enforce limits to protect server resources.
- Prefer object storage (S3) for scalable production uploads.
- Don’t trust user-provided filenames or mimetypes blindly.
