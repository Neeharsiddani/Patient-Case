import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'path';
import { fileURLToPath } from 'url';

import authRoutes from './routes/authRoutes.js';
import hospitalRoutes from './routes/hospitalRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import doctorRoutes from './routes/doctorRoutes.js';
import consentRoutes from './routes/consentRoutes.js';
import documentRoutes from './routes/documentRoutes.js';
import auditRoutes from './routes/auditRoutes.js';
import fhirRoutes from './routes/fhirRoutes.js';
import healthRoutes from './routes/healthRoutes.js';
import voiceRoutes from './routes/voiceRoutes.js';
import abdmRoutes from './routes/abdmRoutes.js';
import hisRoutes from './routes/hisRoutes.js';
import { errorHandler } from './middleware/errorHandler.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const app = express();

// Trust Railway and production reverse proxies (enables correct req.ip resolution for rate limiters)
app.set('trust proxy', 1);

// 1. Security Headers via Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: 'cross-origin' }
}));

// 2. CORS Configuration with Strict Origin Allow-List
const isProduction = process.env.NODE_ENV === 'production';
const envOrigins = (process.env.ALLOWED_ORIGINS || process.env.CORS_ORIGIN || process.env.CLIENT_URL || '')
  .split(',')
  .map(o => o.trim())
  .filter(Boolean);

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:5173',
  'https://neeharsiddani.github.io',
  'https://eshwarajaysai.github.io',
  ...envOrigins
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Allow non-browser requests with no origin (e.g. server-to-server, unit tests, curl)
    if (!origin) {
      return callback(null, true);
    }
    if (allowedOrigins.includes(origin) || (!isProduction && origin.startsWith('http://localhost:'))) {
      return callback(null, true);
    }
    return callback(new Error(`Blocked by CORS policy: Origin '${origin}' is not authorized.`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// 3. Rate Limiting for Clinical API Protection
// Apply dedicated strict limiters first for sensitive endpoints (supporting both /api and root paths)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 200 : 30, // 30 login attempts per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Login Attempts',
    message: 'Too many login attempts from this IP address. Please wait 15 minutes before retrying.'
  }
});
app.use(['/api/auth/login', '/auth/login'], authLimiter);

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'test' ? 300 : 60, // 60 document uploads per 15 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Upload Rate Limit Exceeded',
    message: 'Too many document uploads from this IP. Please wait before uploading more files.'
  }
});
app.use(['/api/documents/upload', '/documents/upload'], uploadLimiter);

// Global clinical API rate limiter (executes exactly once per request across all endpoints)
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Too Many Requests',
    message: 'Too many requests from this IP. Please try again later.'
  }
});
app.use(apiLimiter);

// 4. Request Body Parsers
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ extended: true, limit: '15mb' }));

// 5. Mount API Routes (Both /api/* and root /* to support any VITE_API_BASE_URL configuration)
const routes = [
  ['/health', healthRoutes],
  ['/auth', authRoutes],
  ['/hospitals', hospitalRoutes],
  ['/patients', patientRoutes],
  ['/doctor', doctorRoutes],
  ['/consent', consentRoutes],
  ['/documents', documentRoutes],
  ['/audit-logs', auditRoutes],
  ['/audit', auditRoutes],
  ['/fhir', fhirRoutes],
  ['/voice', voiceRoutes],
  ['/abdm', abdmRoutes],
  ['/his', hisRoutes]
];

for (const [subpath, router] of routes) {
  app.use(`/api${subpath}`, router);
  app.use(subpath, router);
}

// Root container health probe endpoint for Railway default healthchecks
app.get(['/', '/api'], (req, res) => {
  res.status(200).json({
    status: 'HEALTHY',
    service: 'MediMitra Clinical Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// 6. 404 Handler for Unmatched API Endpoints
const handleNotFound = (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint Not Found',
    message: `The requested clinical API route '${req.originalUrl}' does not exist.`
  });
};
app.use(handleNotFound);

// 7. Global Error Handler
app.use(errorHandler);
