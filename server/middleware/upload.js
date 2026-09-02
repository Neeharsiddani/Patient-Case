import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadDir = process.env.UPLOAD_DIR || path.resolve(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const ALLOWED_EXTENSIONS = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
const DANGEROUS_EXTENSIONS = ['.exe', '.js', '.sh', '.php', '.bat', '.cmd', '.vbs', '.py', '.rb', '.pl', '.jsp', '.asp', '.dll', '.bin'];

const MIME_EXTENSION_MAP = {
  'application/pdf': ['.pdf'],
  'image/jpeg': ['.jpg', '.jpeg'],
  'image/jpg': ['.jpg', '.jpeg'],
  'image/png': ['.png'],
  'image/webp': ['.webp']
};

// Storage engine with sanitized, unguessable UUID filenames and isolated upload directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const rawExt = path.extname(file.originalname).toLowerCase();
    const safeExt = ALLOWED_EXTENSIONS.includes(rawExt) ? rawExt : '.bin';
    const uniqueName = `${uuidv4()}${safeExt}`;
    cb(null, uniqueName);
  }
});

// Strict MIME type, file extension, and path-traversal validation
const createUploadError = (msg) => {
  const err = new Error(msg);
  err.statusCode = 400;
  err.name = 'UploadValidationError';
  return err;
};

const fileFilter = (req, file, cb) => {
  // 1. Sanitize original filename (strip path traversal characters, directory separators, null bytes)
  const rawBasename = path.basename(file.originalname).replace(/\0/g, '');
  const cleanName = rawBasename.replace(/[^a-zA-Z0-9._-]/g, '_');
  file.sanitizedOriginalName = cleanName;

  // 2. Reject path traversal indicators
  if (file.originalname.includes('..') || file.originalname.includes('/') || file.originalname.includes('\\')) {
    return cb(createUploadError('Path traversal sequence detected in filename.'), false);
  }

  // 3. Reject executable or dangerous double extensions (e.g. "image.jpg.exe", "report.pdf.js")
  const lowerName = cleanName.toLowerCase();
  for (const dang of DANGEROUS_EXTENSIONS) {
    if (lowerName.endsWith(dang) || lowerName.includes(`${dang}.`)) {
      return cb(createUploadError(`Security Alert: Executable or script file extension '${dang}' is strictly prohibited.`), false);
    }
  }

  // 4. Validate extension against strict whitelist
  const ext = path.extname(cleanName).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(createUploadError(`Unsupported file extension '${ext}'. Only PDF, JPEG, PNG, and WebP clinical files are allowed.`), false);
  }

  // 5. Validate MIME type against strict whitelist and extension consistency
  const allowedExtensionsForMime = MIME_EXTENSION_MAP[file.mimetype];
  if (!allowedExtensionsForMime || !allowedExtensionsForMime.includes(ext)) {
    return cb(createUploadError(`MIME type '${file.mimetype}' does not match file extension '${ext}'. Potential MIME-spoofing rejected.`), false);
  }

  cb(null, true);
};

const maxFileSize = (parseInt(process.env.MAX_FILE_SIZE_MB, 10) || 10) * 1024 * 1024;

export const upload = multer({
  storage,
  limits: {
    fileSize: maxFileSize,
    files: 1
  },
  fileFilter
});
