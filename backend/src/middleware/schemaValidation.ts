import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { ErrorFactory } from '@/utils/errorCategories';
import { ValidationError } from '@/middleware/responseWrapper';

// Schema validation options
interface ValidationOptions {
  abortEarly?: boolean;
  allowUnknown?: boolean;
  stripUnknown?: boolean;
  convert?: boolean;
}

// Default validation options
const defaultOptions: ValidationOptions = {
  abortEarly: false, // Return all validation errors
  allowUnknown: false, // Don't allow unknown fields
  stripUnknown: true, // Remove unknown fields
  convert: true, // Convert types when possible
};

// Validation target enum
export enum ValidationTarget {
  BODY = 'body',
  QUERY = 'query',
  PARAMS = 'params',
  HEADERS = 'headers',
}

// Schema validation middleware factory
export const validateSchema = (
  schema: Joi.ObjectSchema,
  target: ValidationTarget = ValidationTarget.BODY,
  options: ValidationOptions = {}
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationOptions = { ...defaultOptions, ...options };
    
    // Get data to validate based on target
    let dataToValidate: any;
    switch (target) {
      case ValidationTarget.BODY:
        dataToValidate = req.body;
        break;
      case ValidationTarget.QUERY:
        dataToValidate = req.query;
        break;
      case ValidationTarget.PARAMS:
        dataToValidate = req.params;
        break;
      case ValidationTarget.HEADERS:
        dataToValidate = req.headers;
        break;
      default:
        dataToValidate = req.body;
    }

    // Validate data against schema
    const { error, value } = schema.validate(dataToValidate, validationOptions);

    if (error) {
      // Convert Joi validation errors to our format
      const validationErrors: ValidationError[] = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message,
        code: detail.type.toUpperCase().replace(/\./g, '_'),
        value: detail.context?.value,
      }));

      const validationError = ErrorFactory.validation(
        'Validation failed',
        { errors: validationErrors, target }
      );

      return next(validationError);
    }

    // Replace the original data with validated/sanitized data
    switch (target) {
      case ValidationTarget.BODY:
        req.body = value;
        break;
      case ValidationTarget.QUERY:
        req.query = value;
        break;
      case ValidationTarget.PARAMS:
        req.params = value;
        break;
      case ValidationTarget.HEADERS:
        // Don't replace headers, just validate
        break;
    }

    next();
  };
};

// Common validation schemas
export const commonSchemas = {
  // Pagination schema
  pagination: Joi.object({
    page: Joi.number().integer().min(1).default(1),
    limit: Joi.number().integer().min(1).max(100).default(20),
    sort: Joi.string().optional(),
    order: Joi.string().valid('ASC', 'DESC', 'asc', 'desc').default('DESC'),
  }),

  // Search schema
  search: Joi.object({
    search: Joi.string().trim().max(255).optional(),
    filters: Joi.object().optional(),
  }),

  // ID parameter schema
  idParam: Joi.object({
    id: Joi.alternatives().try(
      Joi.number().integer().positive(),
      Joi.string().pattern(/^\d+$/).message('ID must be a positive integer')
    ).required(),
  }),

  // Date range schema
  dateRange: Joi.object({
    startDate: Joi.date().iso().optional(),
    endDate: Joi.date().iso().min(Joi.ref('startDate')).optional(),
  }),

  // File upload schema
  fileUpload: Joi.object({
    file: Joi.object({
      fieldname: Joi.string().required(),
      originalname: Joi.string().required(),
      encoding: Joi.string().required(),
      mimetype: Joi.string().required(),
      size: Joi.number().integer().positive().required(),
      buffer: Joi.binary().required(),
    }).required(),
  }),
};

// Validation middleware for common patterns
export const validatePagination = validateSchema(
  commonSchemas.pagination,
  ValidationTarget.QUERY
);

export const validateSearch = validateSchema(
  commonSchemas.search.concat(commonSchemas.pagination),
  ValidationTarget.QUERY
);

export const validateIdParam = validateSchema(
  commonSchemas.idParam,
  ValidationTarget.PARAMS
);

export const validateDateRange = validateSchema(
  commonSchemas.dateRange,
  ValidationTarget.QUERY
);

// Response validation middleware (for development/testing)
export const validateResponse = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Only validate responses in development
    if (process.env.NODE_ENV !== 'development') {
      return next();
    }

    // Store original json method
    const originalJson = res.json;

    // Override json method to validate response
    res.json = function(data: any) {
      const { error } = schema.validate(data);
      
      if (error) {
        console.warn('Response validation failed:', {
          path: req.path,
          method: req.method,
          errors: error.details.map(detail => ({
            field: detail.path.join('.'),
            message: detail.message,
          })),
        });
      }

      // Call original json method
      return originalJson.call(this, data);
    };

    next();
  };
};

// Schema builder helpers
export class SchemaBuilder {
  // Build CRUD schemas for a resource
  static buildCrudSchemas(baseSchema: Joi.ObjectSchema) {
    return {
      create: baseSchema.fork(
        Object.keys(baseSchema.describe().keys || {}),
        (schema) => schema.required()
      ),
      update: baseSchema.fork(
        Object.keys(baseSchema.describe().keys || {}),
        (schema) => schema.optional()
      ),
      list: commonSchemas.pagination.concat(commonSchemas.search),
      show: commonSchemas.idParam,
      delete: commonSchemas.idParam,
    };
  }

  // Build nested object schema
  static buildNestedSchema(fields: Record<string, Joi.Schema>) {
    return Joi.object(fields);
  }

  // Build array schema with validation
  static buildArraySchema(itemSchema: Joi.Schema, options?: {
    min?: number;
    max?: number;
    unique?: boolean;
  }) {
    let schema = Joi.array().items(itemSchema);
    
    if (options?.min !== undefined) {
      schema = schema.min(options.min);
    }
    
    if (options?.max !== undefined) {
      schema = schema.max(options.max);
    }
    
    if (options?.unique) {
      schema = schema.unique();
    }
    
    return schema;
  }
}

// Custom Joi extensions
export const customJoi = Joi.extend({
  type: 'phone',
  base: Joi.string(),
  messages: {
    'phone.invalid': 'Invalid phone number format',
  },
  validate(value, helpers) {
    // Simple phone validation (can be enhanced)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(value)) {
      return { value, errors: helpers.error('phone.invalid') };
    }
    return { value };
  },
}, {
  type: 'email',
  base: Joi.string(),
  messages: {
    'email.invalid': 'Invalid email format',
  },
  validate(value, helpers) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      return { value, errors: helpers.error('email.invalid') };
    }
    return { value };
  },
});

// Validation error formatter
export class ValidationErrorFormatter {
  static formatJoiError(error: Joi.ValidationError): ValidationError[] {
    return error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message.replace(/"/g, ''),
      code: detail.type.toUpperCase().replace(/\./g, '_'),
      value: detail.context?.value,
    }));
  }

  static formatSequelizeError(error: any): ValidationError[] {
    if (!error.errors || !Array.isArray(error.errors)) {
      return [];
    }

    return error.errors.map((err: any) => ({
      field: err.path || err.field || 'unknown',
      message: err.message,
      code: err.validatorKey || 'VALIDATION_ERROR',
      value: err.value,
    }));
  }
}

// Conditional validation middleware
export const conditionalValidation = (
  condition: (req: Request) => boolean,
  schema: Joi.ObjectSchema,
  target: ValidationTarget = ValidationTarget.BODY
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (condition(req)) {
      return validateSchema(schema, target)(req, res, next);
    }
    next();
  };
};

// Multi-target validation middleware
export const validateMultiple = (validations: Array<{
  schema: Joi.ObjectSchema;
  target: ValidationTarget;
  options?: ValidationOptions;
}>) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const errors: ValidationError[] = [];

    for (const validation of validations) {
      const { schema, target, options = {} } = validation;
      const validationOptions = { ...defaultOptions, ...options };

      let dataToValidate: any;
      switch (target) {
        case ValidationTarget.BODY:
          dataToValidate = req.body;
          break;
        case ValidationTarget.QUERY:
          dataToValidate = req.query;
          break;
        case ValidationTarget.PARAMS:
          dataToValidate = req.params;
          break;
        case ValidationTarget.HEADERS:
          dataToValidate = req.headers;
          break;
      }

      const { error, value } = schema.validate(dataToValidate, validationOptions);

      if (error) {
        errors.push(...ValidationErrorFormatter.formatJoiError(error));
      } else {
        // Update the request with validated data
        switch (target) {
          case ValidationTarget.BODY:
            req.body = value;
            break;
          case ValidationTarget.QUERY:
            req.query = value;
            break;
          case ValidationTarget.PARAMS:
            req.params = value;
            break;
        }
      }
    }

    if (errors.length > 0) {
      const validationError = ErrorFactory.validation(
        'Multiple validation errors',
        { errors }
      );
      return next(validationError);
    }

    next();
  };
};