import { defineCollection } from 'astro:content';
import { glob } from 'astro/loaders';
import { z } from 'astro/zod';

// Everything Nurani edits lives in content/, which Sveltia CMS writes to.
// Images are uploaded to public/uploads and referenced as plain /uploads/... paths.
const optionalPath = z.string().trim().optional().transform(value => value || undefined);

const posts = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/posts' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    date: z.coerce.date(),
    draft: z.boolean().default(false),
    tags: z.array(z.string().trim().min(1)).default([]),
    cover: optionalPath,
    coverAlt: z.string().default(''),
  }),
});

const things = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './content/things' }),
  schema: z.object({
    title: z.string().trim().min(1),
    description: z.string().trim().min(1),
    date: z.coerce.date(),
    url: optionalPath,
    image: optionalPath,
    imageAlt: z.string().default(''),
    draft: z.boolean().default(false),
  }),
});

const pages = defineCollection({
  loader: glob({ pattern: '*.md', base: './content/pages' }),
  schema: z.object({
    title: z.string().optional(),
    greeting: z.string().optional(),
  }),
});

export const collections = { posts, things, pages };
