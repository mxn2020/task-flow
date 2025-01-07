// utils/validation.ts
import { Scope, SystemScopeType } from '@/types';
import { BookmarkScope, BrainstormScope, ChecklistScope, EventScope, FlowScope, MilestoneScope, NoteScope, ResourceScope, ScopeItem, TimeblockScope } from '@/types/scopes_2';
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

export function validateScope(
  scope: Scope, 
  data: Partial<ScopeItem>, 
  isDatabase = false
) {
  const { metadata } = scope;
  const { fields } = metadata;

  const processedData = isDatabase ? toCamelCase(data) : data;
  const processedFields = isDatabase ? 
    toCamelCase(fields) as Record<string, FieldConfig> : 
    fields;

  Object.entries(processedFields).forEach(([field, config]) => {
    if (processedData[field] !== undefined) {
      validateFieldValue(processedData[field], config, field);
    }
  });
}


export function validateSystemScope(
  scopeType: SystemScopeType | string, 
  data: Partial<ScopeItem>, 
  isDatabase = false
 ) {
  const processedData = isDatabase ? toCamelCase(data) : data;
  const metadata = processedData.metadata;
 
  if (!metadata) return;
 
  switch (scopeType) {
    case 'brainstorm':
    case 'note': {
      const scope = metadata as BrainstormScope['metadata'] | NoteScope['metadata'];
      validateRequiredFields(scope, ['content'], isDatabase);
      validateFieldValue(scope.content, { type: 'text', required: true }, 'content');
      break;
    }
 
    case 'checklist': {
      const scope = metadata as ChecklistScope['metadata'];
      if (scope.items) {
        validateFieldValue(scope.items, {
          type: 'array',
          itemConfig: { type: 'object' }
        }, 'items');
      }
      break;
    }
 
    case 'flow': {
      const scope = metadata as FlowScope['metadata'];
      validateRequiredFields(scope, ['flow_status'], isDatabase);
      validateFieldValue(scope.flow_status, {
        type: 'select',
        options: ['pending', 'ready', 'blocked', 'completed'],
        required: true
      }, 'flow_status');
      
      if (scope.dependencies) {
        validateFieldValue(scope.dependencies, {
          type: 'array',
          itemConfig: { type: 'object' }
        }, 'dependencies');
      }
      break;
    }
 
    case 'milestone': {
      const scope = metadata as MilestoneScope['metadata'];
      validateRequiredFields(scope, ['successCriteria', 'progress'], isDatabase);
      validateFieldValue(scope.progress, {
        type: 'number',
        min: 0,
        max: 100,
        required: true
      }, 'progress');
      validateFieldValue(scope.successCriteria, {
        type: 'array',
        itemConfig: { type: 'string' },
        required: true
      }, 'successCriteria');
      break;
    }
 
    case 'resource': {
      const scope = metadata as ResourceScope['metadata'];
      validateRequiredFields(scope, ['format'], isDatabase);
      validateFieldValue(scope.format, {
        type: 'select',
        options: ['article', 'video', 'book', 'course'],
        required: true
      }, 'format');
      break;
    }
 
    case 'timeblock': {
      const scope = metadata as TimeblockScope['metadata'];
      validateRequiredFields(scope, ['startTime', 'endTime'], isDatabase);
      validateFieldValue(scope.startTime, {
        type: 'date',
        required: true
      }, 'startTime');
      validateFieldValue(scope.endTime, {
        type: 'date',
        required: true
      }, 'endTime');
      break;
    }
 
    case 'event': {
      const scope = metadata as EventScope['metadata'];
      validateRequiredFields(scope, ['start', 'end', 'recurring'], isDatabase);
      validateFieldValue(scope.start, {
        type: 'date',
        required: true
      }, 'start');
      validateFieldValue(scope.end, {
        type: 'date',
        required: true
      }, 'end');
      validateFieldValue(scope.recurring, {
        type: 'boolean',
        required: true
      }, 'recurring');
      break;
    }
 
    case 'bookmark': {
      const scope = metadata as BookmarkScope['metadata'];
      validateRequiredFields(scope, ['url'], isDatabase);
      validateFieldValue(scope.url, {
        type: 'string',
        required: true
      }, 'url');
      break;
    }
  }
 }