// src/lib/errors/types.ts
export class AppError extends Error {
    public readonly statusCode: number;
    public readonly code: string;
    public readonly isOperational: boolean;
  
    constructor(message: string, statusCode = 500, code = 'INTERNAL_ERROR', isOperational = true) {
      super(message);
      this.statusCode = statusCode;
      this.code = code;
      this.isOperational = isOperational;
      Error.captureStackTrace(this, this.constructor);
    }
  }
  