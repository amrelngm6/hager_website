import type { Request, Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../../types';
import { ContentService } from './content.service';

// ---------------------------------------------------------------------------
// ContentController
//
// Thin orchestration layer — no business logic, no SQL.
// ---------------------------------------------------------------------------

export class ContentController {
  private readonly service: ContentService;

  constructor() {
    this.service = new ContentService();
  }

  // GET /content — public
  getAll = async (
    _req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const sections = await this.service.getAll();
      // Return as a key→data map for easy consumption by the theme's JS
      const map: Record<string, unknown> = {};
      for (const s of sections) {
        map[s.section_key] = s.data;
      }
      res.status(200).json({ success: true, data: map });
    } catch (err) {
      next(err);
    }
  };

  // GET /content/:key — public
  getByKey = async (
    req: Request,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      const section = await this.service.getByKey(req.params.key);
      res.status(200).json({ success: true, data: section });
    } catch (err) {
      next(err);
    }
  };

  // PUT /content/:key — protected
  update = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    try {
      if (!req.session?.user) {
        res.status(401).json({ message: 'Unauthorized' });
        return;
      }
      const section = await this.service.update(
        req.params.key,
        req.body.data,
        req.session.user,
      );
      res.status(200).json({ success: true, data: section });
    } catch (err) {
      next(err);
    }
  };
}
