export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // Default error response
  let status = err.status || 500;
  let message = err.message || 'Internal server error';

  // Handle specific error types
  if (err.name === 'ValidationError') {
    status = 400;
    message = 'Validation error';
  }

  if (err.code === 'ECONNRESET' || err.code === 'ECONNREFUSED') {
    status = 503;
    message = 'Service temporarily unavailable';
  }

  res.status(status).json({
    error: message,
    timestamp: new Date().toISOString(),
    path: req.path,
    method: req.method
  });
};
