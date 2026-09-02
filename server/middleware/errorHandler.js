/**
 * Centralized Error Handler Middleware
 * Sanitizes errors to prevent exposing stack traces, DB details, or sensitive PII to clients.
 */
export const errorHandler = (err, req, res, next) => {
  // Log server-side with sanitized context
  console.error(`[${new Date().toISOString()}] ❌ Request Error (${req.method} ${req.originalUrl}):`, err.message);

  if (err.name === 'MulterError' || err.name === 'UploadValidationError' || err.statusCode === 400) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File Too Large',
        message: 'The uploaded file exceeds the 10MB maximum size limit.'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'Invalid File',
      message: err.message
    });
  }

  const statusCode = err.statusCode || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An internal server error occurred while processing your clinical request.'
    : err.message || 'Internal Server Error';

  res.status(statusCode).json({
    success: false,
    error: err.name || 'Error',
    message
  });
};
