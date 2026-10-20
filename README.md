# nurani.work

Nurani Zaman's blog and little portfolio. It's a static Astro site, deployed to GitHub Pages and edited in [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/admin/`.

**For now it's live at https://nur-zaman.github.io/nurani/** from the public repo `nur-zaman/nurani`. The domain nurani.work comes later; see [Custom domain](#custom-domain-later).

## For Nurani: writing a post

1. Go to **https://nur-zaman.github.io/nurani/admin/** (later **https://nurani.work/admin/**) and choose **Sign In with GitHub**.
2. Open **Blog posts → New Blog post**, write, and click **Save**.
3. Posts start as **Draft**. A draft is saved but stays off the live site. When the post is ready, switch **Draft** off and save again.
4. About two minutes after you save, the site rebuilds by itself.

You can edit the home intro, the About page, your profile picture, the taglines and the footer links under **Pages** and **Settings**. Pictures you upload go to `public/uploads/`.

## Where things live

| Content | Location |
| --- | --- |
| Blog posts | `content/posts/*.md` (the filename becomes the URL) |
| Things I made | `content/things/*.md` |
| Home intro, About | `content/pages/home.md`, `content/pages/about.md` |
| Name, taglines, avatar, links | `content/settings/site.json` |
| Uploaded images | `public/uploads/` |
| Sky, cats | `public/art/` |
| Styles | `src/styles/global.css` |
| Editor configuration | `public/admin/config.yml` |

Every post needs `title`, `description` and `date` (`YYYY-MM-DD`). `draft`, `tags`, `cover` and `coverAlt` are optional. Drafts appear only in local preview. They never appear on the live site, in tags, RSS or the sitemap, but they are readable in the public Git repository.

## Local preview

Use Node 24 (`.nvmrc`):

```sh
npm ci
npm run dev          # background dev server on http://localhost:4321
npm run dev:stop
```

In dev, open the editor at `http://localhost:4321/admin/index.html`. In Chrome or Edge you can use **Work with Local Repository** to edit the files on disk without signing in.

## Checks and publishing

```sh
npm run check
npm test     # builds fixtures: empty site, pagination, drafts, links, feeds
npm run build
```

GitHub Actions (`.github/workflows/deploy.yml`) checks, tests and deploys `main` to GitHub Pages.

## One-time setup

### 1. Give Nurani access

Once Nurani has a GitHub account, add her under **nur-zaman/nurani → Settings → Collaborators** with write access. The editor commits as whoever signs in.

### 2. Editor sign-in (Cloudflare Worker)

GitHub Pages can't run the OAuth handshake, so a free Cloudflare Worker does it.

1. Deploy [sveltia-cms-auth](https://github.com/sveltia/sveltia-cms-auth) to Cloudflare Workers using the **Deploy to Cloudflare** button in its README. Note the worker URL, for example `https://sveltia-cms-auth.<account>.workers.dev`.
2. In the `nur-zaman` GitHub account, go to **Settings → Developer settings → OAuth Apps → New OAuth App**:
   - Homepage URL: `https://nur-zaman.github.io/nurani/`
   - Authorization callback URL: `<worker URL>/callback`
3. In the worker's **Settings → Variables**, add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (encrypted) and `ALLOWED_DOMAINS` = `nur-zaman.github.io, nurani.work`.
4. In `public/admin/config.yml`, replace the `TODO` in `base_url` with the worker URL.

Until then, Nurani can use **Sign In Using Access Token** with a fine-grained GitHub token that has *Contents: read and write* on `nur-zaman/nurani`.

## Custom domain (later)

1. Change `deploy.config.mjs` to `site = 'https://nurani.work'` and `base = '/'`.
2. In `public/admin/config.yml`, set `site_url` and `display_url` to `https://nurani.work`, and set `logo.src` to `/favicon.svg`.
3. Add `public/CNAME` containing `nurani.work`.
4. At the DNS provider, add the four GitHub Pages `A` records for the apex (`185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`), plus a `www` `CNAME` to `nur-zaman.github.io`.
5. Go to **Settings → Pages → Custom domain**, enter `nurani.work` and enable **Enforce HTTPS**. Update the OAuth app's Homepage URL.

Content never needs changing: images and links are stored as `/uploads/...` and `/about/`, and the base path is added at build time.

### Making the repo private

GitHub Pages from a **private** repo needs a paid plan (GitHub Pro, Team or Enterprise). On the free plan, making the repo private takes the site offline. With Pro, switch it under **Settings → General → Danger Zone → Change visibility**; Pages and the editor keep working.
