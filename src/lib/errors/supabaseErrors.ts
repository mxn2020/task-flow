// src/lib/errors/supabaseErrors.ts

import { AppError } from "./types";

export class SupabaseError extends AppError {
    constructor(message: string, statusCode = 500) {
      super(message, statusCode, 'SUPABASE_ERROR');
    }
  }
  
  export class SupabaseConfigError extends SupabaseError {
    constructor(missingConfig: string) {
      super(`Supabase configuration error: ${missingConfig} is required`, 500);
    }
  }