import * as AjvModule from 'ajv';
import * as addFormatsModule from 'ajv-formats';
import type { Request, Response } from 'express';

const AjvClass = (AjvModule as any).default ?? AjvModule;
const addFormats = (addFormatsModule as any).default ?? addFormatsModule;

const ajv = new AjvClass({ allErrors: true, useDefaults: true, $data: true });
addFormats(ajv);

const validate = (schema: Record<string, unknown>, req: Request, res: Response): boolean => {
  const validateFunction = ajv.compile(schema);
  const valid = validateFunction(req.body);

  if (!valid) {
    res.status(400).json({ errors: validateFunction.errors });
    return false;
  }

  return true;
};

export default validate;
