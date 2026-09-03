import { z } from 'zod';

// ---------------------------------------------------------------------------
// Database row shape
// ---------------------------------------------------------------------------

export interface ContentSection {
  section_key: string;
  data: Record<string, unknown>;
  updated_at: Date;
}

// ---------------------------------------------------------------------------
// Allowed section keys (must match seed data)
// ---------------------------------------------------------------------------

export const ALLOWED_SECTION_KEYS = [
  'general',
  'intro',
  'about',
  'skills',
  'projects',
  'clients',
  'contact',
  'hello',
  'hobbies',
  'age',
  'cv',
  'education',
  'experience',
  'awards',
  'msg_success',
  'error',
] as const;

export type SectionKey = (typeof ALLOWED_SECTION_KEYS)[number];

// ---------------------------------------------------------------------------
// Zod schemas for API validation
// ---------------------------------------------------------------------------

export const UpdateContentSchema = z.object({
  data: z.record(z.string(), z.unknown()),
});

export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;

// ---------------------------------------------------------------------------
// Section-specific data interfaces (used in frontend types / documentation)
// ---------------------------------------------------------------------------

export interface ButtonItem {
  label: string;
  action: string;
  link?: string;
  styleClass: string;
}

export interface StatItem {
  icon: string;
  text: string;
}

export interface SkillItem {
  name: string;
  rating: number; // 1–5
}

export interface SkillCategory {
  name: string;
  icon: string;
  skills: SkillItem[];
}

export interface ProjectItem {
  title: string;
  link: string;
  image: string;
  mediaType: 'image' | 'gallery' | 'youtube' | 'video';
  summary: string;
  gallery?: string[];
  youtubeId?: string;
  videoUrl?: string;
}

export interface ClientItem {
  name: string;
  logoUrl: string;
}

export interface DirectContactItem {
  label: string;
  icon: string;
  value: string;
}

export interface SocialLinkItem {
  icon: string;
  url: string;
  class: string;
}

export interface ContentBlock {
  tag: string;
  className?: string;
  content?: string;
  items?: string[];
}

// ---------------------------------------------------------------------------
// Public API response shape
// ---------------------------------------------------------------------------

export interface ContentSectionPublic {
  section_key: string;
  data: Record<string, unknown>;
  updated_at: Date;
}
