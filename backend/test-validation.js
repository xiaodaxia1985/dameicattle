const Joi = require('joi');

// Copy the exact validation schema from the backend
const loginSchema = Joi.object({
  username: Joi.string()
    .min(3)
    .max(50)
    .required()
    .messages({
 