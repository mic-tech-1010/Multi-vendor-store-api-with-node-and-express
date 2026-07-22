import * as AjvModule from "ajv";
import * as addFormatsModule from "ajv-formats";
import type { RequestHandler } from "express";

const AjvClass = (AjvModule as any).default ?? AjvModule;
const addFormats = (addFormatsModule as any).default ?? addFormatsModule;

const ajv = new AjvClass({
  allErrors: true,
  useDefaults: true,
  coerceTypes: true,
});

addFormats(ajv);

function createValidator(
  schema: Record<string, unknown>,
  target: "body" | "query" | "params"
): RequestHandler {
  const validate = ajv.compile(schema);

  return (req, res, next) => {
    const valid = validate(req[target]);

    if (!valid) {
      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors: validate.errors,
      });
    }

    next();
  };
}

export const validateBody = (schema: Record<string, unknown>) =>
  createValidator(schema, "body");

export const validateQuery = (schema: Record<string, unknown>) =>
  createValidator(schema, "query");

export const validateParams = (schema: Record<string, unknown>) =>
  createValidator(schema, "params");