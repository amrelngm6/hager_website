import client from './client';
import type { User } from '../types';

export const usersApi = {
  list: () => client.get<{ success: true; users: User[]; meta: { page: number; limit: number; total: number } }>('/users'),

  get: (id: string) => client.get<{ user: User }>(`/users/${id}`),

  create: (data: {
    first_name: string;
    last_name: string;
    email: string;
    password: string;
    parent_id?: string;
  }) => client.post<{ user: User }>('/users', data),

  update: (id: string, data: Partial<Pick<User, 'first_name' | 'email' | 'status'>>) =>
    client.put<{ user: User }>(`/users/${id}`, data),

  resetPassword: (id: string, password: string) =>
    client.put(`/users/${id}/password`, { password }),

  delete: (id: string) => client.delete(`/users/${id}`),
};
