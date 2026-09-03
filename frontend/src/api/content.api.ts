import client from './client';

export interface ContentSection {
  section_key: string;
  data: Record<string, unknown>;
  updated_at: string;
}

export const contentApi = {
  /** GET /content — returns all sections as a key→data map */
  getAll: () =>
    client.get<{ success: true; data: Record<string, Record<string, unknown>> }>('/content'),

  /** GET /content/:key — returns one section */
  getByKey: (key: string) =>
    client.get<{ success: true; data: ContentSection }>(`/content/${key}`),

  /** PUT /content/:key — save one section (admin only) */
  update: (key: string, data: Record<string, unknown>) =>
    client.put<{ success: true; data: ContentSection }>(`/content/${key}`, { data }),
};
