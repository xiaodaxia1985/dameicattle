import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { 
  validateSchema, 
  ValidationTarget, 
  validatePagination, 
  validateIdParam,
  commonSchemas,
  SchemaBuilder 
} from '@/middleware/schemaValidation';
import { ErrorFactory } from '@/utils/errorCategories';

describe('Schema Validation Middleware', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockRequest = {
      body: {},
      query: {},
      params: {},
      headers: {},
    };

    mockResponse = {};
    mockNext = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateSchema function', () => {
    const testSchema = Joi.object({
      name: Joi.string().required(),
      age: Joi.number().integer().min(0).max(120),
      email: Joi.string().email(),
    });

    it('should validate body data successfully', () => {
      mockRequest.body = {
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      };

      const middleware = validateSchema(testSchema, ValidationTarget.BODY);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toEqual({
        name: 'John Doe',
        age: 30,
        email: 'john@example.com',
      });
    });

    it('should validate query data successfully', () => {
      mockRequest.query = {
        name: 'John Doe',
        age: '30',
      };

      const middleware = validateSchema(testSchema, ValidationTarget.QUERY);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.query).toEqual({
        name: 'John Doe',
        age: 30, // Should be converted to number
      });
    });

    it('should validate params data successfully', () => {
      mockRequest.params = {
        name: 'John Doe',
      };

      const middleware = validateSchema(testSchema, ValidationTarget.PARAMS);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
    });

    it('should pass validation errors to next middleware', () => {
      mockRequest.body = {
        age: 150, // Invalid age
        email: 'invalid-email', // Invalid email
      };

      const middleware = validateSchema(testSchema, ValidationTarget.BODY);
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith(
        expect.objectContaining({
          name: 'CategorizedError',
          category: 'validation',
          statusCode: 422,
        })
      );
    });

    it('should strip unknown fields when stripUnknown is true', () => {
      mockRequest.body = {
        name: 'John Doe',
        age: 30,
        unknownField: 'should be removed',
      };

      const middleware = validateSchema(testSchema, ValidationTarget.BODY, {
        stripUnknown: true,
      });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).not.toHaveProperty('unknownField');
    });

    it('should allow unknown fields when allowUnknown is true', () => {
      mockRequest.body = {
        name: 'John Doe',
        unknownField: 'should be allowed',
      };

      const middleware = validateSchema(testSchema, ValidationTarget.BODY, {
        allowUnknown: true,
        stripUnknown: false,
      });
      middleware(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalledWith();
      expect(mockRequest.body).toHaveProperty('unknownField');
    });
  });

  describe('Common validation middleware', () => {
    describe('validatePagination', () => {
      it('should validate pagination parameters', () => {
        mockRequest.query = {
          page: '2',
          limit: '10',
          sort: 'name',
          order: 'ASC',
        };

        validatePagination(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockRequest.query).toEqual({
          page: 2,
          limit: 10,
          sort: 'name',
          order: 'ASC',
        });
      });

      it('should use default values for pagination', () => {
        mockRequest.query = {};

        validatePagination(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockRequest.query).toEqual({
          page: 1,
          limit: 20,
          order: 'DESC',
        });
      });

      it('should reject invalid pagination parameters', () => {
        mockRequest.query = {
          page: '0', // Invalid page
          limit: '200', // Exceeds max limit
        };

        validatePagination(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'validation',
          })
        );
      });
    });

    describe('validateIdParam', () => {
      it('should validate numeric ID parameter', () => {
        mockRequest.params = { id: '123' };

        validateIdParam(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
        expect(mockRequest.params.id).toBe(123);
      });

      it('should validate string numeric ID parameter', () => {
        mockRequest.params = { id: '456' };

        validateIdParam(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith();
      });

      it('should reject non-numeric ID parameter', () => {
        mockRequest.params = { id: 'abc' };

        validateIdParam(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'validation',
          })
        );
      });

      it('should reject negative ID parameter', () => {
        mockRequest.params = { id: '-1' };

        validateIdParam(mockRequest as Request, mockResponse as Response, mockNext);

        expect(mockNext).toHaveBeenCalledWith(
          expect.objectContaining({
            category: 'validation',
          })
        );
      });
    });
  });

  describe('Common schemas', () => {
    describe('pagination schema', () => {
      it('should validate pagination object', () => {
        const { error, value } = commonSchemas.pagination.validate({
          page: 2,
          limit: 50,
          sort: 'created_at',
          order: 'DESC',
        });

        expect(error).toBeUndefined();
        expect(value).toEqual({
          page: 2,
          limit: 50,
          sort: 'created_at',
          order: 'DESC',
        });
      });

      it('should apply defaults for pagination', () => {
        const { error, value } = commonSchemas.pagination.validate({});

        expect(error).toBeUndefined();
        expect(value).toEqual({
          page: 1,
          limit: 20,
          order: 'DESC',
        });
      });
    });

    describe('search schema', () => {
      it('should validate search parameters', () => {
        const { error, value } = commonSchemas.search.validate({
          search: 'test query',
          filters: { status: 'active' },
        });

        expect(error).toBeUndefined();
        expect(value).toEqual({
          search: 'test query',
          filters: { status: 'active' },
        });
      });

      it('should trim search string', () => {
        const { error, value } = commonSchemas.search.validate({
          search: '  test query  ',
        });

        expect(error).toBeUndefined();
        expect(value.search).toBe('test query');
      });
    });

    describe('dateRange schema', () => {
      it('should validate date range', () => {
        const { error, value } = commonSchemas.dateRange.validate({
          startDate: '2023-01-01T00:00:00.000Z',
          endDate: '2023-12-31T23:59:59.999Z',
        });

        expect(error).toBeUndefined();
        expect(value.startDate).toBeInstanceOf(Date);
        expect(value.endDate).toBeInstanceOf(Date);
      });

      it('should reject invalid date range (end before start)', () => {
        const { error } = commonSchemas.dateRange.validate({
          startDate: '2023-12-31T00:00:00.000Z',
          endDate: '2023-01-01T00:00:00.000Z',
        });

        expect(error).toBeDefined();
      });
    });
  });

  describe('SchemaBuilder', () => {
    const baseSchema = Joi.object({
      name: Joi.string(),
      email: Joi.string().email(),
      age: Joi.number().integer(),
    });

    describe('buildCrudSchemas', () => {
      it('should build CRUD schemas', () => {
        const schemas = SchemaBuilder.buildCrudSchemas(baseSchema);

        expect(schemas).toHaveProperty('create');
        expect(schemas).toHaveProperty('update');
        expect(schemas).toHaveProperty('list');
        expect(schemas).toHaveProperty('show');
        expect(schemas).toHaveProperty('delete');
      });

      it('should make all fields required for create schema', () => {
        const schemas = SchemaBuilder.buildCrudSchemas(baseSchema);
        
        const { error } = schemas.create.validate({
          name: 'John',
          // Missing email and age
        });

        expect(error).toBeDefined();
        expect(error?.details).toHaveLength(2); // email and age are required
      });

      it('should make all fields optional for update schema', () => {
        const schemas = SchemaBuilder.buildCrudSchemas(baseSchema);
        
        const { error } = schemas.update.validate({
          name: 'John',
          // email and age are optional
        });

        expect(error).toBeUndefined();
      });
    });

    describe('buildArraySchema', () => {
      it('should build array schema with constraints', () => {
        const itemSchema = Joi.string();
        const arraySchema = SchemaBuilder.buildArraySchema(itemSchema, {
          min: 1,
          max: 5,
          unique: true,
        });

        const { error: validError } = arraySchema.validate(['a', 'b', 'c']);
        expect(validError).toBeUndefined();

        const { error: emptyError } = arraySchema.validate([]);
        expect(emptyError).toBeDefined(); // Violates min constraint

        const { error: tooManyError } = arraySchema.validate(['a', 'b', 'c', 'd', 'e', 'f']);
        expect(tooManyError).toBeDefined(); // Violates max constraint

        const { error: duplicateError } = arraySchema.validate(['a', 'b', 'a']);
        expect(duplicateError).toBeDefined(); // Violates unique constraint
      });
    });
  });
});