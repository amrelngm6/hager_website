import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types';
import { UserService } from './user.service';
import type { ListUsersQuery } from './user.types';
// ---------------------------------------------------------------------------
// UserController
//
// Thin orchestration layer — no business logic, no SQL.
// ---------------------------------------------------------------------------
export class UserController {
  private readonly service: UserService;
  constructor() {
    this.service = new UserService();
  }
  // GET /users
  list = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const query = req.query as unknown as ListUsersQuery;
      const result = await this.service.list( query);
      res.status(200).json({
        success: true,
        users: result.data,
        meta: {
          page: result.page,
          limit: result.limit,
          total: result.total,
        },
      });
    } catch (err) {
      next(err);
    }
  };
  // GET /users/:id
  getById = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.service.getById(req.params.id);
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };
  // POST /users
  create = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.session?.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await this.service.create(req.body, req.session?.user ?? undefined);
      res.status(201).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };
  // PUT /users/:id
  update = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const user = await this.service.update(
        req.params.id,
        req.body,
        req.session?.user ?? undefined,
      );
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };
  
  // PATCH /users/:id/status
  updateStatus = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {

      if (!req.session?.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      const user = await this.service.updateStatus(
        req.params.id,
        req.body,
        req.session?.user,
      );
      res.status(200).json({ success: true, data: user });
    } catch (err) {
      next(err);
    }
  };
  // DELETE /users/:id
  remove = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.session?.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }

      await this.service.delete(req.params.id, req.session?.user);
      res.status(204).send();
    } catch (err) {
      next(err);
    }
  };
}
