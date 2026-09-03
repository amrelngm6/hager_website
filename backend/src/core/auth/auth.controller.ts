import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from '../../types';
import { loginUser, changePassword } from './auth.service';

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { email, password } = req.body as { email?: string; password?: string };

    if (!email || !password) {
      res.status(400).json({ message: 'Email and password are required' });
      return;
    }

    const user = await loginUser(email.trim().toLowerCase(), password);
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.user = user;
      req.session.save((err2) => {
        if (err2) return next(err2);
        res.json({ user });
      });
    });
  } catch (err) {
    next(err);
  }
};

export const logout = (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void => {
  req.session.destroy((err) => {
    if (err) return next(err);
    res.clearCookie('mcpanel.sid');
    res.json({ message: 'Logged out' });
  });
};

export const me = (req: AuthenticatedRequest, res: Response): void => {
  res.json({ user: req.user });
};

export const updatePassword = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string;
      newPassword?: string;
    };

    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: 'currentPassword and newPassword are required' });
      return;
    }

    await changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    next(err);
  }
};
