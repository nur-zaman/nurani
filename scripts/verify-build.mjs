import assert from 'node:assert/strict';
import { cp, mkdir, mkdtemp, readFile, readdir, realpath, rm, writeFile } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { base, site } from '../deploy.config.mjs';

// Build fixtures in an isolated copy, never editing Nurani's actual content.
const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const cacheRoot = join(projectRoot, '.cache');
await mkdir(cacheRoot, { recursive: true });
const fixtureRoot = await mkdtemp(join(cacheRoot, 'verify-'));
const astroPackage = JSON.parse(await readFile(join(projectRoot, 'node_modules/astro/package.json'), 'utf8'));
const astroCli = resolve(projectRoot, 'node_modules/astro', astroPackage.bin.astro);

async function removeFixturePath(target) {
  const resolvedTarget = await realpath(target);
  const resolvedFixture = await realpath(fixtureRoot);
  assert(relative(await realpath(cacheRoot), resolvedFixture).startsWith('verify-'), 'Fixture must stay inside the ignored cache directory');
  assert(resolvedTarget === resolvedFixture || resolvedTarget.startsWith(resolvedFixture + sep), 'Cleanup must stay inside the fixture directory');
  await rm(resolvedTarget, { recursive: true, force: true });
}

async function build() {
  const result = spawnSync(process.execPath, [astroCli, 'build', '--root', fixtureRoot], {
    cwd: projectRoot,
    encoding: 'utf8',
    env: { ...process.env, ASTRO_TELEMETRY_DISABLED: '1' },
    maxBuffer: 10 * 1024 * 1024,
  });
  assert.equal(result.status, 0, `Fixture build failed:\n${result.stdout}\n${result.stderr}\n${result.error ?? ''}`);
}

async function files(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const groups = await Promise.all(entries.map(entry => entry.isDirectory() ? files(join(directory, entry.name)) : [join(directory, entry.name)]));
  return groups.flat();
}

async function emptyFolder(path) {
  await removeFixturePath(path);
  await mkdir(path);
}

const output = (...parts) => join(fixtureRoot, 'dist', ...parts);
const html = path => readFile(output(path), 'utf8');
const prefix = base.replace(/\/$/, '');
const esc = text => text.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&');
const root = esc(prefix);

try {
  for (const path of ['src', 'public', 'content', 'astro.config.mjs', 'deploy.config.mjs', 'package.json', 'tsconfig.json']) {
    await cp(join(projectRoot, path), join(fixtureRoot, path), { recursive: true });
  }
  const postsRoot = join(fixtureRoot, 'content/posts');
  const thingsRoot = join(fixtureRoot, 'content/things');

  // Empty collections, regardless of how much real content is published later.
  await emptyFolder(postsRoot);
  await emptyFolder(thingsRoot);
  await build();
  assert.match(await html('blog/index.html'), /Nothing here yet/);
  assert.match(await html('things/index.html'), /Nothing here yet/);
  assert.match(await html('index.html'), /class="cat-heading"/);
  assert.doesNotMatch(await html('index.html'), /Lately I wrote/);
  assert.doesNotMatch(await html('rss.xml'), /<item>/);
  console.log('✓ Empty blog, empty things, and empty RSS build correctly.');

  await mkdir(join(postsRoot, 'nested'));
  for (const [filename, title, date, draft] of [
    ['older', 'Fixture oldest', '2026-01-01', false],
    ['newest', 'Fixture newest', '2026-04-01', false],
    ['nested/second', 'Fixture second', '2026-03-01', false],
    ['third', 'Fixture third', '2026-02-01', false],
    ['fourth', 'Fixture fourth', '2026-02-15', false],
    ['fifth', 'Fixture fifth', '2026-03-15', false],
    ['sixth', 'Fixture sixth', '2026-03-20', false],
    ['hidden-draft', 'PRIVATE_DRAFT_SENTINEL', '2026-05-01', true],
  ]) {
    await writeFile(join(postsRoot, `${filename}.md`), [
      '---', `title: ${title}`, `description: ${title} description`, `date: ${date}`, `draft: ${draft}`, 'tags: [fixture, testing]',
      ...(filename === 'newest' ? ['cover: /art/cat-sit.png', 'coverAlt: A round calico cat'] : []),
      '---', '', '## A Markdown heading', '', 'A paragraph with **emphasis** and [an internal link](/about/).', '',
      '```js', 'const example = "' + 'long-code-'.repeat(30) + '";', '```', '',
      '| One | Two |', '| --- | --- |', '| A cell | Another cell |', '', '> A quotation.',
    ].join('\n'));
  }
  await writeFile(join(thingsRoot, 'secret.md'), '---\ntitle: PRIVATE_THING_SENTINEL\ndescription: A draft thing\ndate: 2026-01-01\ndraft: true\n---\n');
  await writeFile(join(thingsRoot, 'quilt.md'), '---\ntitle: Fixture quilt\ndescription: A patchwork quilt\ndate: 2026-02-01\nurl: https://example.com/quilt\nimage: /art/cat-sleep.png\nimageAlt: A sleeping cat\n---\n');
  await build();

  const blog = await html('blog/index.html');
  const pageTwo = await html('blog/page/2/index.html');
  assert(blog.indexOf('Fixture newest') < blog.indexOf('Fixture sixth'));
  assert(blog.indexOf('Fixture sixth') < blog.indexOf('Fixture fifth'));
  assert(blog.indexOf('Fixture fifth') < blog.indexOf('Fixture second'));
  assert.doesNotMatch(blog, /Fixture oldest/);
  assert.match(blog, new RegExp(`href="${root}/blog/page/2/"`));
  assert.match(pageTwo, /Fixture oldest/);
  assert.match(pageTwo, new RegExp(`href="${root}/blog/" rel="prev"`));
  assert.doesNotMatch(pageTwo, /rel="next"/);
  const home = await html('index.html');
  assert.match(home, /Fixture newest/);
  assert.doesNotMatch(home, /Fixture second/, 'Home shows only the latest three posts.');
  const article = await html('blog/newest/index.html');
  assert.match(article, /A Markdown heading/);
  assert.match(article, /<table>/);
  assert.match(article, /<blockquote>/);
  assert.match(article, /astro-code/);
  assert.match(article, /alt="A round calico cat"/);
  assert.match(article, new RegExp(`rel="canonical" href="${esc(site + prefix)}/blog/newest/"`));
  assert.match(article, new RegExp(`href="${root}/about/"`), 'Markdown links get the base path.');
  assert.match(article, /<time datetime="2026-04-01">Apr 01, 2026<\/time>/);
  assert.match(article, /1 min read/);
  assert.match(await html('blog/nested/second/index.html'), /Fixture second/);
  assert.match(await html('tags/fixture/index.html'), /Fixture newest/);
  assert.match(await html('things/index.html'), /Fixture quilt/);
  assert.match(await html('things/index.html'), /href="https:\/\/example.com\/quilt"/);
  assert.equal(((await html('rss.xml')).match(/<item>/g) ?? []).length, 7);
  assert.match(await html('404.html'), /noindex/);

  const builtFiles = await files(output());
  const builtPaths = new Set(builtFiles.map(path => relative(output(), path).split(sep).join('/')));
  for (const file of builtFiles.filter(path => /\.(html|xml|txt)$/.test(path))) {
    const text = await readFile(file, 'utf8');
    assert.doesNotMatch(text, /PRIVATE_DRAFT_SENTINEL|PRIVATE_THING_SENTINEL|hidden-draft/, `Draft leaked into ${file}`);
    if (!file.endsWith('.html') || file.includes(`${sep}admin${sep}`)) continue;
    assert.doesNotMatch(text, /<script\b/, 'Public pages should ship no client JavaScript.');
    for (const match of text.matchAll(/(?:href|src)="(\/[^"#?]*)(?:[?#][^"]*)?"/g)) {
      assert(!prefix || match[1].startsWith(prefix + '/'), `Link missing base path: ${match[1]} in ${file}`);
      const path = decodeURIComponent(match[1].slice(prefix.length)).slice(1);
      const target = path === '' ? 'index.html' : path.endsWith('/') ? path + 'index.html' : path;
      assert(builtPaths.has(target), `Broken internal link: ${match[1]} in ${file}`);
    }
  }
  assert(builtPaths.has('admin/index.html') && builtPaths.has('admin/config.yml'), 'The CMS editor must be published.');
  assert(!builtPaths.has('blog/hidden-draft/index.html'));
  assert(!builtPaths.has('blog/page/3/index.html'));
  assert(![...builtPaths].some(path => path.endsWith('.md')));
  assert.doesNotMatch(await html('sitemap-0.xml'), /admin|404/);
  console.log('✓ Publishing, dates, ordering, pagination, nested URLs, Markdown, images, things, internal links, and feeds verified.');
  console.log('✓ Draft posts and things are absent from all production pages and feeds.');
} finally {
  await removeFixturePath(fixtureRoot);
}
