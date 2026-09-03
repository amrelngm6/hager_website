import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { ValidationError } from '../core/errors/httpErrors';

// ---------------------------------------------------------------------------
// Validation targets
// ---------------------------------------------------------------------------
type ValidationTarget = 'body' | 'query' | 'params';

interface ValidateOptions {
  /** Which part of the request to validate. Defaults to 'body'. */
  target?: ValidationTarget;
}

// ---------------------------------------------------------------------------
// validate() — factory that returns an Express middleware
//
// Usage:
//   router.post('/', validate(CreateWorkflowSchema), controller.create);
//   router.get('/',  validate(ListQuerySchema, { target: 'query' }), controller.list);
// ---------------------------------------------------------------------------
export function validate(schema: ZodSchema, options: ValidateOptions = {}) {
  const target = options.target ?? 'body';

  return (req: Request, _res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req[target]);

    if (!result.success) {
      const details = formatZodErrors(result.error);
      return next(
        new ValidationError('Validation failed.', details, 'VALIDATION_ERROR'),
      );
    }

    // Replace the request field with the parsed (coerced / stripped) value
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (req as unknown as Record<string, unknown>)[target] = result.data;
    next();
  };
}

// ---------------------------------------------------------------------------
// Format Zod errors into a flat array for the response envelope
// ---------------------------------------------------------------------------
function formatZodErrors(error: ZodError): Array<{ field: string; message: string }> {
  return error.issues.map((e) => ({
    field: e.path.join('.') || 'root',
    message: e.message,
  }));
}
