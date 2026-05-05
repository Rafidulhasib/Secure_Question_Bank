export function notFound(req, _res, next) {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.status = 404;
  next(error);
}

export function errorHandler(error, _req, res, _next) {
  const status = error.status || error.statusCode || 500;

  if (error.name === "ValidationError") {
    res.status(422).json({
      message: "Validation failed.",
      details: Object.values(error.errors).map((item) => item.message)
    });
    return;
  }

  if (error.code === 11000) {
    res.status(409).json({
      message: "A record with the same unique value already exists.",
      fields: Object.keys(error.keyPattern || {})
    });
    return;
  }

  res.status(status).json({
    message: error.message || "Something went wrong."
  });
}
