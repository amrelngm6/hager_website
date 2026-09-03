import { z } from 'zod';
export interface ContentSection {
    section_key: string;
    data: Record<string, unknown>;
    updated_at: Date;
}
export declare const ALLOWED_SECTION_KEYS: readonly ["general", "intro", "about", "skills", "projects", "clients", "contact", "hello", "hobbies", "age", "cv", "education", "experience", "awards", "msg_success", "error"];
export type SectionKey = (typeof ALLOWED_SECTION_KEYS)[number];
export declare const UpdateContentSchema: z.ZodObject<{
    data: z.ZodRecord<z.ZodString, z.ZodUnknown>;
}, z.core.$strip>;
export type UpdateContentInput = z.infer<typeof UpdateContentSchema>;
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
    rating: number;
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
export interface ContentSectionPublic {
    section_key: string;
    data: Record<string, unknown>;
    updated_at: Date;
}
