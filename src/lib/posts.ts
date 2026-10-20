import { withBase } from './paths';
import { getCollection, type CollectionEntry } from 'astro:content';

export type Post = CollectionEntry<'posts'>;
export type Thing = CollectionEntry<'things'>;
export const PAGE_SIZE = 6;

export interface Tag {
  label: string;
  slug: string;
}

const newestFirst = <T extends { id: string; data: { date: Date } }>(a: T, b: T) =>
  b.data.date.valueOf() - a.data.date.valueOf() || a.id.localeCompare(b.id);

// Drafts show only in local preview, never on the live site.
export async function getPosts(includeDrafts = import.meta.env.DEV): Promise<Post[]> {
  const posts = await getCollection('posts', ({ data }) => includeDrafts || !data.draft);
  return posts.sort(newestFirst);
}

export async function getThings(includeDrafts = import.meta.env.DEV): Promise<Thing[]> {
  const things = await getCollection('things', ({ data }) => includeDrafts || !data.draft);
  return things.sort(newestFirst);
}

export function postUrl(post: Post): string {
  return withBase(`/blog/${post.id.split('/').map(encodeURIComponent).join('/')}/`);
}

export function pageUrl(page: number): string {
  return withBase(page === 1 ? '/blog/' : `/blog/page/${page}/`);
}

export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short', day: '2-digit', year: 'numeric', timeZone: 'UTC',
  }).format(date);
}

export function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function normaliseTag(tag: string): string {
  return tag.trim()
    .toLocaleLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function getPostTags(post: Post): Tag[] {
  const tags = new Map<string, Tag>();
  for (const rawTag of post.data.tags) {
    const label = rawTag.trim();
    const slug = normaliseTag(label);
    if (slug && !tags.has(slug)) tags.set(slug, { label, slug });
  }
  return [...tags.values()];
}

export function getTags(posts: Post[]): Tag[] {
  const tags = new Map<string, Tag>();
  for (const post of posts) {
    for (const tag of getPostTags(post)) {
      if (!tags.has(tag.slug)) tags.set(tag.slug, tag);
    }
  }
  return [...tags.values()].sort((a, b) => a.label.localeCompare(b.label));
}

export function postsWithTag(posts: Post[], slug: string): Post[] {
  return posts.filter(post => getPostTags(post).some(tag => tag.slug === slug));
}

export function tagUrl(tag: Tag): string {
  return withBase(`/tags/${encodeURIComponent(tag.slug)}/`);
}

export function plainText(markdown: string): string {
  return markdown
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*_~>#|()[\]]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function readingTime(post: Post): number {
  const words = plainText(post.body ?? '').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}
