"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
// ---------------------------------------------------------------------------
// UserController
//
// Thin orchestration layer — no business logic, no SQL.
// ---------------------------------------------------------------------------
class UserController {
    constructor() {
        // GET /users
        this.list = async (req, res, next) => {
            try {
                const query = req.query;
                const result = await this.service.list(query);
                res.status(200).json({
                    success: true,
                    users: result.data,
                    meta: {
                        page: result.page,
                        limit: result.limit,
                        total: result.total,
                    },
                });
            }
            catch (err) {
                next(err);
            }
        };
        // GET /users/:id
        this.getById = async (req, res, next) => {
            try {
                const user = await this.service.getById(req.params.id);
                res.status(200).json({ success: true, data: user });
            }
            catch (err) {
                next(err);
            }
        };
        // POST /users
        this.create = async (req, res, next) => {
            try {
                if (!req.session?.user) {
                    res.status(401).json({ message: 'Unauthorized' });
                    return;
                }
                const user = await this.service.create(req.body, req.session?.user ?? undefined);
                res.status(201).json({ success: true, data: user });
            }
            catch (err) {
                next(err);
            }
        };
        // PUT /users/:id
        this.update = async (req, res, next) => {
            try {
                const user = await this.service.update(req.params.id, req.body, req.session?.user ?? undefined);
                res.status(200).json({ success: true, data: user });
            }
            catch (err) {
                next(err);
            }
        };
        // PATCH /users/:id/status
        this.updateStatus = async (req, res, next) => {
            try {
                if (!req.session?.user) {
                    res.status(401).json({ message: 'Unauthorized' });
                    return;
                }
                const user = await this.service.updateStatus(req.params.id, req.body, req.session?.user);
                res.status(200).json({ success: true, data: user });
            }
            catch (err) {
                next(err);
            }
        };
        // DELETE /users/:id
        this.remove = async (req, res, next) => {
            try {
                if (!req.session?.user) {
                    res.status(401).json({ message: 'Unauthorized' });
                    return;
                }
                await this.service.delete(req.params.id, req.session?.user);
                res.status(204).send();
            }
            catch (err) {
                next(err);
            }
        };
        this.service = new user_service_1.UserService();
    }
}
exports.UserController = UserController;
//# sourceMappingURL=user.controller.js.map