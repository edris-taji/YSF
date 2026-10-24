# YSF — Youth Savior Foundation website

Official website of **Youth Savior Foundation (Y.S.F)** — بنیاداجتماعی-فرهنگی جوانان ناجی — a youth socio-cultural
foundation based in Bekrabad, Herat, Afghanistan.

**Live site:** https://edris-taji.github.io/YSF/

## Pages

| Page | File |
|---|---|
| Home | `index.html` |
| About Us · About Founder · Vision & Mission · Committee · Members | `about-us.html` · `Hossaini.html` · `vision-and-mission.html` · `committee.html` · `members.html` |
| Activities · Classes · Seminars | `activities.html` · `classes.html` · `seminars.html` |
| Contracts · Relationships · Effective Personalities · Letters of Appreciation | `contracts.html` · `relationships.html` · `effective-personalities.html` · `letters-of-appreciation.html` |
| Contact | `contact.html` |

## Technology

- Static **HTML5, CSS3 and vanilla JavaScript** — no framework, no build step, no package manager.
- `css/style.css` — the design system (colour tokens, typography, components); `js/main.js` — navigation, slideshow,
  "Show more" panels, article dialogs and contact-form validation.
- Icons: `img/icons.svg` sprite (Font Awesome Free, CC BY 4.0). Fonts: Inter and Manrope from Google Fonts.
- No backend, database, API keys or environment variables. The contact form validates in the browser and then opens
  the visitor's email app addressed to `youthsavior.scf@gmail.com` (`mailto:`), so nothing is stored server-side.

```
├── index.html, *.html     # 14 pages
├── css/style.css          # styles
├── js/main.js             # behaviour (loaded with defer)
├── img/                   # images (*.webp are the optimized versions shown on the site)
├── files/                 # PDFs (CV, articles, member list)
├── chart.png              # full-size committee chart
├── sitemap.xml, robots.txt, .nojekyll
└── tools/check_site.py    # link / asset-path / HTML checks (also run by GitHub Actions)
```

## Run locally

Any static file server works. With Python 3:

```bash
python -m http.server 8080
```

Then open http://localhost:8080/.

## Check before pushing

GitHub Pages is **case-sensitive** (`photo.JPG` ≠ `photo.jpg`), unlike Windows and macOS. Run:

```bash
python tools/check_site.py .
```

It reports missing files, wrong upper/lower case in paths, broken in-page anchors and unbalanced HTML tags. The same check
runs automatically on every push and pull request (`.github/workflows/site-checks.yml`).

## Editing content

Pages are plain HTML — edit the text directly. Keep paths **relative** (no leading `/`), because the site is served from
the `/YSF/` sub-path. When adding an image, prefer WebP, keep the file name in lower case, and include `alt`, `width`
and `height` attributes.

## Deployment

GitHub Pages serves the `main` branch from the repository root (Settings → Pages → *Deploy from a branch* → `main` /
`(root)`). Every push to `main` republishes the site automatically, usually within a minute; progress is visible under the
repository's **Actions** tab ("pages build and deployment").

## Known limitations

- The contact form relies on the visitor having an email app configured (no server-side form handling).
- Some photos are low resolution (500 px wide) originals.
- Content items awaiting the foundation's review: the "About Us" introduction paragraph, the Health activity photo
  (stock image), and the linked contract PDFs, which are not yet available.
