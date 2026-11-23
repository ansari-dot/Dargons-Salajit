// Global error handling middleware
// mysql2 wraps every failed connection attempt in an AggregateError whose message is empty,
// so translate those (and the common misconfiguration errors) into a clear, actionable reply.
const DB_CONNECTION_CODES = ['ECONNREFUSED', 'ETIMEDOUT', 'EHOSTUNREACH', 'ENOTFOUND', 'EPIPE', 'PROTOCOL_CONNECTION_LOST'];
// Auth / missing-schema codes are reported with their own hint inside describeDatabaseError()

const getErrorCode = (err) => {
  if (!err) return null;
  if (err.code) return err.code;
  if (Array.isArray(err.errors)) {
    const inner = err.errors.find((e) => e && e.code);
    if (inner) return inner.code;
  }
  return null;
};

const describeDatabaseError = (err) => {
  const code = getErrorCode(err);
  if (!code) return null;

  const dbTarget = `${process.env.DB_HOST || 'localhost'}:${process.env.DB_PORT || 3306}`;

  if (DB_CONNECTION_CODES.includes(code)) {
    return {
      code,
      message: `Database unavailable: could not connect to MySQL at ${dbTarget}. Please make sure the MySQL server is running and then retry.`,
    };
  }

  if (code === 'ER_ACCESS_DENIED_ERROR') {
    return {
      code,
      message: 'Database unavailable: MySQL rejected the credentials in server/.env (check DB_USER and DB_PASSWORD).',
    };
  }

  if (code === 'ER_BAD_DB_ERROR') {
    return {
      code,
      message: `Database unavailable: the database '${process.env.DB_NAME || 'unknown'}' does not exist. Create it and restart the API.`,
    };
  }

  return null;
};


const errorHandler = (err, req, res, next) => {
  const databaseError = describeDatabaseError(err);

  if (databaseError) {
    console.error(`[Error] ${req.method} ${req.url} - ${databaseError.message} (${databaseError.code})`);
    if (process.env.NODE_ENV !== 'production' && err.stack) {
      console.error(err.stack);
    }

    return res.status(503).json({
      success: false,
      message: databaseError.message,
      code: databaseError.code,
      ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
    });
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  console.error(`[Error] ${req.method} ${req.url} - ${message}`);
  if (process.env.NODE_ENV !== 'production' && err.stack) {
    console.error(err.stack);
  }

  res.status(statusCode).json({
    success: false,
    message: message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = errorHandler;
