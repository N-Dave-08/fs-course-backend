import { type Request, type Response, Router } from "express";
import multer from "multer";
import fs from 'fs';
import path from 'path';

const router: Router = Router();

// ----------------------------
// Configure Multer storage
// ----------------------------
const storage = multer.diskStorage({
    // Determine the folder where files will be stored
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/';

        // Check if the folder exists; if not, create it recursively
        // fs.mkdirSync with { recursive: true } ensures parent directories are created if needed
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        cb(null, uploadDir); // Tell Multer to save the file here
    },

    // Generate a unique filename for each uploaded file
    filename: (req, file, cb) => {
        // Unique suffix: timestamp + random number
        // Helps prevent filename collisions
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        // Keep original file extension using path.extname
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

// ----------------------------
// File filter for allowed types
// ----------------------------
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    const allowedTypes = /jpeg|jpg|png|gif/; // Regex for allowed extensions

    // Test the file's extension
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());

    // Test the file's MIME type
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
        cb(null, true); // Accept the file
    } else {
        // Reject the file if it doesn't match allowed types
        cb(new Error('Only image files are allowed'));
    }
};

// ----------------------------
// Configure Multer middleware
// ----------------------------
const upload = multer({
    storage,                       // Use custom storage
    limits: { fileSize: 5 * 1024 * 1024 }, // Max 5MB
    fileFilter                      // Only accept allowed image types
});

// ----------------------------
// Upload route
// ----------------------------
router.post("/", upload.single("image"), (req: Request, res: Response) => {
    // If Multer didn't attach a file, return an error
    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'No file uploaded'
        });
    }

    // Return the uploaded file info
    res.json({ success: true, file: req.file });
});

export default router;