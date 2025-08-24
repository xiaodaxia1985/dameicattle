import { Request, Response, NextFunction } from 'express';
import * as Joi from 'joi';

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error } = schema.validate(req.body);
    if (error) {
      res.status(400).json({ 
        error: error.details.map((detail: any) => detail.message) 
      });
      return;
    }
    next();
  };
};