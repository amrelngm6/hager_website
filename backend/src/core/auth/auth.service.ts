import bcrypt from 'bcryptjs';
import { execute, query, queryOne } from '../database/pool';
import { User, SessionUser } from '../../types';
import { createError } from '../../middlewares/error.middleware';

export const loginUser = async (
  emailOrUsername: string,
  password: string
): Promise<SessionUser> => {
  // Rewritten as a parameterized query. The original built this string via
  // concatenation of raw user input, which was a SQL injection vulnerability
  // (and used double-quoted string literals, which aren't valid MySQL syntax
  // by default anyway). Never interpolate user input into SQL text.
  const user = await queryOne<User>(
    `SELECT * FROM users WHERE (email = ?)`,
    [emailOrUsername]
  );

  if (!user) {
    throw createError('User not found', 401);
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    throw createError('Invalid password', 401);
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
  };
};

export const changePassword = async (
  userId: string,
  currentPassword: string,
  newPassword: string
): Promise<void> => {
  if (newPassword.length < 8) {
    throw createError('New password must be at least 8 characters', 400);
  }

  const user = await queryOne<User>(
    'SELECT * FROM users WHERE id = ?',
    [userId]
  );

  if (!user) {
    throw createError('User not found', 404);
  }

  const valid = await bcrypt.compare(currentPassword, user.password_hash);
  if (!valid) {
    throw createError('Current password is incorrect', 400);
  }

  const hash = await bcrypt.hash(newPassword, 12);
  await query('UPDATE users SET password_hash = ? WHERE id = ?', [hash, userId]);
};