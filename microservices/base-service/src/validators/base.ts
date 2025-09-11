import * as Joi from 'joi';

export const createBaseSchema = Joi.object({
  name: Joi.string().min(2).max(100).required(),
  address: Joi.string().optional(),
  area: Joi.number().min(0).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  manager_id: Joi.number().integer().optional()
});

export const updateBaseSchema = Joi.object({
  name: Joi.string().min(2).max(100).optional(),
  address: Joi.string().optional(),
  area: Joi.number().min(0).optional(),
  latitude: Joi.number().min(-90).max(90).optional(),
  longitude: Joi.number().min(-180).max(180).optional(),
  manager_id: Joi.number().integer().optional()
});

export const validateSchema = (schema: Joi.ObjectSchema) => schema;