import type { Request, Response, NextFunction } from 'express';

type ParsedMongoError = {
  status: number;
  body: Record<string, unknown>;
};

/**
 * Parse common Mongo / Mongoose errors into HTTP-friendly responses.
 * - duplicate key (code 11000) -> 409
 * - validation error -> 400 with field messages
 * - cast error -> 400
 * - network errors -> 503
 */
export function parseMongoError(error: any): ParsedMongoError | null {
  if (!error || typeof error !== 'object') return null;

  // MongoDB duplicate key error
  if (error.name === 'MongoServerError' && (error as any).code === 11000) {
    const keyValue = (error as any).keyValue || {};
    return {
      status: 409,
      body: {
        message: 'Duplicate value',
        fields: keyValue,
      },
    };
  }

  // Mongoose validation error
  if (error.name === 'ValidationError') {
    const fields: Record<string, string> = {};
    for (const key of Object.keys(error.errors || {})) {
      try {
        fields[key] = error.errors[key].message || String(error.errors[key]);
      } catch {
        fields[key] = 'Invalid value';
      }
    }
    return {
      status: 400,
      body: {
        message: 'Validation failed',
        fields,
      },
    };
  }

  // Cast errors (invalid ObjectId etc.)
  if (error.name === 'CastError' || error.name === 'BSONTypeError') {
    return {
      status: 400,
      body: { message: 'Invalid value for field', details: error.message },
    };
  }

  // Network / server errors
  if (error.name === 'MongoNetworkError' || error.name === 'MongooseServerSelectionError') {
    return {
      status: 503,
      body: { message: 'Database connection error', details: error.message },
    };
  }

  return null;
}

// Express error handler middleware that uses parseMongoError to respond.
export function mongoErrorHandler(
  err: any,
  _req: Request,
  res: Response,
  next: NextFunction
) {
  const parsed = parseMongoError(err);
  if (parsed) {
    return res.status(parsed.status).json(parsed.body);
  }
  return next(err);
}

export default parseMongoError;
