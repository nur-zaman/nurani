import settings from '../content/settings/site.json';
import words from '../content/settings/text.json';

export interface SiteLink {
  label: string;
  url: string;
}

// Site-wide details come from content/settings/site.json so they can be edited in the CMS.
export const site = {
  name: settings.name,
  title: settings.title || settings.name,
  description: settings.description,
  taglines: (settings.taglines ?? []).filter(Boolean) as string[],
  avatar: settings.avatar || undefined,
  avatarAlt: settings.avatarAlt || settings.name,
  links: (settings.links ?? []).filter(link => link.label && link.url) as SiteLink[],
  language: 'en',
};

// Every label around the site, from content/settings/text.json ("Words around the site" in the CMS).
// A field left empty in the editor falls back to the default here.
const defaults = {
  navHome: 'Home',
  navBlog: 'Blog',
  navThings: 'Things',
  navAbout: 'About',
  latestHeading: 'Lately I wrote',
  allPostsLink: 'All posts →',
  blogTitle: 'Blog',
  tagsLabel: 'Tags',
  taggedTitle: 'Tagged',
  blogEmpty: 'Nothing here yet.',
  newerLink: '← Newer',
  olderLink: 'Older →',
  pageLabel: 'Page',
  pageOfLabel: 'of',
  minRead: 'min read',
  backToBlog: '← All posts',
  endOfPost: '← Back to all posts',
  thingsTitle: 'Things I made',
  thingsEmpty: 'Nothing here yet.',
  notFoundTitle: 'Nothing here',
  notFoundText: "This page doesn't exist.",
  notFoundLink: '← Go home',
  rssLink: 'RSS',
  skipLink: 'Skip to content',
};

export type TextKey = keyof typeof defaults;

export const text = Object.fromEntries(
  Object.entries(defaults).map(([key, fallback]) => {
    const value = (words as Partial<Record<TextKey, string>>)[key as TextKey];
    return [key, typeof value === 'string' && value.trim() ? value.trim() : fallback];
  }),
) as Record<TextKey, string>;
