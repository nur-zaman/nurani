# nurani.work

Nurani Zaman's blog and little portfolio. It's a static Astro site, deployed to GitHub Pages and edited in [Sveltia CMS](https://github.com/sveltia/sveltia-cms) at `/admin/`.

Live at **https://nurani.work**, from the public repo `nur-zaman/nurani`. DNS is at Porkbun.

## For Nurani: writing a post

1. Go to **https://nurani.work/admin/** and choose **Sign In with GitHub**.
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
   - Homepage URL: `https://nurani.work`
   - Authorization callback URL: `<worker URL>/callback`
3. In the worker's **Settings → Variables**, add `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` (encrypted) and `ALLOWED_DOMAINS` = `nurani.work`.
4. In `public/admin/config.yml`, replace the `TODO` in `base_url` with the worker URL.

Until then, Nurani can use **Sign In Using Access Token** with a fine-grained GitHub token that has *Contents: read and write* on `nur-zaman/nurani`.

## Domain

`public/CNAME` and `deploy.config.mjs` set the site to `https://nurani.work`. The Porkbun DNS has the four GitHub Pages `A` records (`185.199.108–111.153`), the matching `AAAA` records (`2606:50c0:8000–8003::153`) and `www` → `nur-zaman.github.io`.

Content stores images and links as `/uploads/...` and `/about/`. If the site ever moves under a sub-path, change `base` in `deploy.config.mjs` and the build adds the prefix.

### Making the repo private

GitHub Pages from a **private** repo needs a paid plan (GitHub Pro, Team or Enterprise). On the free plan, making the repo private takes the site offline. With Pro, switch it under **Settings → General → Danger Zone → Change visibility**; Pages and the editor keep working.
