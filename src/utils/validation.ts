// utils/validation.ts
import { toSnakeCase, toCamelCase } from '@/lib/utils';

export type FieldType =
  | 'string'
  | 'number'
  | 'boolean'
  | 'date'
  | 'array'
  | 'select'
  | 'text'
  | 'object';

export interface FieldConfig {
  type: FieldType;
  required?: boolean;
  position?: number;
  description?: string;
  options?: string[];
  multiple?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  minDate?: string;
  maxDate?: string;
  minItems?: number;
  maxItems?: number;
  itemConfig?: FieldConfig;
}

export interface ScopeMetadata {
  fields: Record<string, FieldConfig>;
  ui?: {
    hideTitle?: boolean;
    contentAsTitle?: boolean;
    autoTitle?: boolean;
  };
}

export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export function validateRequiredFields(data: any, fields: string[], isDatabase = false) {
  fields.forEach(field => {
    const checkField = isDatabase ? toCamelCase({ [field]: null })[field] : field;
    if (data[checkField] === undefined || data[checkField] === null || data[checkField] === '') {
      throw new ValidationError(`${field} is required`, field);
    }
  });
}

export function validateFieldValue(value: any, config: FieldConfig, field: string) {
  if (value === undefined || value === null) {
    if (config.required) {
      throw new ValidationError(`${field} is required`, field);
    }
    return;
  }

  switch (config.type) {
    case 'string':
    case 'text':
      if (typeof value !== 'string') {
        throw new ValidationError(`${field} must be a string`, field);
      }
      if (config.minLength && value.length < config.minLength) {
        throw new ValidationError(`${field} must be at least ${config.minLength} characters`, field);
      }
      if (config.maxLength && value.length > config.maxLength) {
        throw new ValidationError(`${field} must be no more than ${config.maxLength} characters`, field);
      }
      break;

    case 'number':
      if (typeof value !== 'number') {
        throw new ValidationError(`${field} must be a number`, field);
      }
      if (config.min !== undefined && value < config.min) {
        throw new ValidationError(`${field} must be at least ${config.min}`, field);
      }
      if (config.max !== undefined && value > config.max) {
        throw new ValidationError(`${field} must be no more than ${config.max}`, field);
      }
      break;

    case 'boolean':
      if (typeof value !== 'boolean') {
        throw new ValidationError(`${field} must be a boolean`, field);
      }
      break;

    case 'date':
      if (!(value instanceof Date) && isNaN(Date.parse(value))) {
        throw new ValidationError(`${field} must be a valid date`, field);
      }
      if (config.minDate && new Date(value) < new Date(config.minDate)) {
        throw new ValidationError(`${field} must be after ${config.minDate}`, field);
      }
      if (config.maxDate && new Date(value) > new Date(config.maxDate)) {
        throw new ValidationError(`${field} must be before ${config.maxDate}`, field);
      }
      break;

    case 'array':
      if (!Array.isArray(value)) {
        throw new ValidationError(`${field} must be an array`, field);
      }
      if (config.minItems !== undefined && value.length < config.minItems) {
        throw new ValidationError(`${field} must have at least ${config.minItems} items`, field);
      }
      if (config.maxItems !== undefined && value.length > config.maxItems) {
        throw new ValidationError(`${field} must have no more than ${config.maxItems} items`, field);
      }
      if (config.itemConfig) {
        value.forEach((item, index) => {
          validateFieldValue(item, config.itemConfig!, `${field}[${index}]`);
        });
      }
      break;

    case 'select':
      if (!config.options?.includes(value)) {
        throw new ValidationError(
          `${field} must be one of: ${config.options?.join(', ')}`,
          field
        );
      }
      break;
  }
}

