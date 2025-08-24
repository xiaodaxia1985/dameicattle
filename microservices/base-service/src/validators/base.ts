import * as Joi from 'joi';

export const createBaseSchema = Joi.object({
  name: Joi.string().required(),
  address: Joi.string().required(),
  contact_person: Joi.string().required(),
  phone: Joi.string().required()
});

export const updateBaseSchema = Joi.object({
  name: Joi.string(),
  address: Joi.string(),
  contact_person: Joi.string(),
  phone: Joi.string()
});

export const validateSchema = (schema: Joi.ObjectSchema) => schema;