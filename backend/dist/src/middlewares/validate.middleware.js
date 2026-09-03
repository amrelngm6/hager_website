"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validate = validate;
const httpErrors_1 = require("../core/errors/httpErrors");
// ---------------------------------------------------------------------------
// validate() — factory that returns an Express middleware
//
// Usage:
//   router.post('/', validate(CreateWorkflowSchema), controller.create);
//   router.get('/',  validate(ListQuerySchema, { target: 'query' }), controller.list);
// ---------------------------------------------------------------------------
function validate(schema, options = {}) {
    const target = options.target ?? 'body';
    return (req, _res, next) => {
        const result = schema.safeParse(req[target]);
        if (!result.success) {
            const details = formatZodErrors(result.error);
            return next(new httpErrors_1.ValidationError('Validation failed.', details, 'VALIDATION_ERROR'));
        }
        // Replace the request field with the parsed (coerced / stripped) value
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        req[target] = result.data;
        next();
    };
}
// ---------------------------------------------------------------------------
// Format Zod errors into a flat array for the response envelope
// ---------------------------------------------------------------------------
function formatZodErrors(error) {
    return error.issues.map((e) => ({
        field: e.path.join('.') || 'root',
        message: e.message,
    }));
}
//# sourceMappingURL=validate.middleware.js.map