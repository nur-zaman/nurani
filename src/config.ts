import settings from '../content/settings/site.json';

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
