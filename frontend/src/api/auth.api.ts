import client from './client';
import type { User } from '../types';

export const authApi = {
  login: (email: string, password: string) =>
    client.post<{ user: User }>('/auth/login', { email, password }),

  logout: () => client.post('/auth/logout'),

  me: () => client.get<{ user: User }>('/auth/me'),

  changePassword: (currentPassword: string, newPassword: string) =>
    client.put('/auth/password', { currentPassword, newPassword }),
};
