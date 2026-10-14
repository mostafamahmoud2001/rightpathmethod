# rightpathmethod.com — first draft

The full marketing and certification website for RightPath™ / RightPath™ Institute. It's a static site built with plain HTML, CSS and vanilla JavaScript, plus a small Node build script with **no dependencies**.

This project is separate from rightpath.foundation. The two sites share no code, assets or navigation.

## Run locally

Requires Node 18+.

```bash
npm start
```

This builds the site into `dist/`, serves it at http://localhost:8080 and rebuilds when anything in `src/` or `public/` changes. Set `PORT` to use another port.

## Build for production

```bash
npm run build
```

Upload the contents of `dist/` to any static host:

- **Netlify / Cloudflare Pages / Vercel:** build command `npm run build`, publish directory `dist`.
- **GitHub Pages / S3 / cPanel:** run the build locally and upload `dist/`.

All links are relative, so the site works from a domain root or a sub-folder.

## Project layout

```
content/              source .docx files (read-only, the copy comes from here)
src/
  layout.html         shared header, nav, footer
  pages/*.html        one file per page; the <!-- meta {...} --> header sets title, description, nav, scripts
  data/placeholders.json   EVERY placeholder fact (see below)
  assets/css/styles.css    all styles; colors and type are CSS variables at the top
  assets/js/site.js        mobile nav toggle, print button
  assets/js/forms.js       Apply + Contact validation and submission (FORM_ENDPOINTS lives here)
  assets/js/directory.js   access-code mock, search, filters, detail view
public/               copied as-is: downloads/, images/, favicon.svg
tools/                white paper print source + PDF script
build.mjs, serve.mjs  build and local preview
```

`build.mjs` also generates `sitemap.xml`, `robots.txt` and `data/directory.json`.

## Placeholders

All placeholder facts are in **`src/data/placeholders.json`**: contact email, phone, address and hours; scoring categories, weights and sample score; fees; certification term; sample verification number; Apply form example entries; and the directory records. Pages pull them in with `{{ph.…}}` and `{{render:…}}` tokens. The build fails if a token doesn't exist.

Every place where the source says "placeholder", "sample" or "replace" shows a gold **Placeholder** label. A draft banner at the top of every page explains the label. Remove the banner from `src/layout.html` before launch.

The hero images and the seal are generic SVG placeholders (`public/images/`). Each page keeps its **Hero Visual Direction** as an HTML comment and in the image `alt` text, so real images can be sourced later.

## Form endpoint (configure before launch)

Open `src/assets/js/forms.js` and set:

```js
const FORM_ENDPOINTS = {
  apply: '',    // e.g. 'https://formspree.io/f/xxxxxxx'
  contact: '',
};
```

Any service that accepts a multipart `POST` and returns a 2xx status will work (Formspree, Basin, Getform, or your own endpoint). Notes:

- While an endpoint is empty, a valid form is **not sent**. The visitor sees "this form is not connected yet. Nothing was sent." The site never shows a success message unless the endpoint accepted the submission.
- The Contact form has an optional file upload (max 10 MB). Formspree only accepts files on paid plans, so check your provider.
- For Netlify Forms, add `data-netlify="true"` and a `name` to each `<form>`, then set the endpoint to `"/"`.

## Directory access code (TODO)

The source says "6-digit code access required". The code screen on the Directory page is a **UI mock only**: any 6 digits unlock it (for the browser session), and `data/directory.json` can be downloaded by anyone. A static site cannot enforce access. Real protection needs a server-side check or a hosted auth service. See the `TODO(access)` notes in `src/pages/directory.html` and `src/assets/js/directory.js`.

## Downloads

- `public/downloads/RightPath_Foundational_Reinforcement_White_Paper.pdf` is generated from `tools/whitepaper.html`, which is the white paper text copied verbatim. If the .docx changes, update the HTML and run `npm run whitepaper` (uses headless Edge or Chrome).
- The other Resources downloads (Certification Guide, Standards Overview, Mark Usage Guidelines, Sample Score Report, Renewal Guide, Institutional Summary Sheet) and four of the five white paper titles have no source documents yet. They show "Placeholder · Not yet available".
- "Download Applicant Checklist" currently prints the Resources page.

## Content decisions

- All copy is verbatim from `RightPath_Website_Tab_Content_Final.docx`. Home and Method also include call-out blocks from the marketing spiel. The Research page includes the white paper's purpose, summary table and executive summary.
- **Left out on purpose:** the line "Adherents' study sets use 62% fewer words than others; saving learners 51% of their time…" from the marketing spiel. **It has no source and is pending client substantiation.**
- Two lines from the marketing spiel were not used because they read as unfinished copy: "Traditional textbook learning is out…In is the modern learning style…" and "Employ the best online learning approach using the RightPath™ method."
- `certification@rightpath.com` is **not** one of the client's domains. It is shown as a flagged placeholder.
- The source's disclaimers are kept: not accreditation, no guaranteed outcomes, an application doesn't guarantee certification.
- The directory's sample record (Northbridge College, RP-2026-0147) uses the source fields. Subject area, location, delivery format, date awarded, scope and links weren't in the source. They're invented sample values, marked Placeholder in the detail view.

## Preview checklist

- [ ] All 12 pages load and the nav works (9 primary links plus Resources, FAQ and Contact in the footer)
- [ ] Mobile menu opens and closes, and Escape closes it
- [ ] Apply and Contact forms show errors for empty and invalid fields, and show the "not connected" notice when valid
- [ ] Directory: the code screen rejects non-6-digit input, then search, filters and "View details" work
- [ ] The white paper PDF downloads from Research and Resources
- [ ] No console errors
- [ ] Mobile and desktop screenshots of Home, Certification and Directory

## Open items for the client

1. Is the "RightPath Institute" in the copy the same entity as the RightPath Foundation (rightpath.foundation), or separate?
2. Should the directory's 6-digit code be a real login, or is the directory public? (The copy also calls it a "public registry".)
3. Real data to replace placeholders: fees, scoring weights, certification term, contact details and address.
4. A source for the "62% fewer words / 51% of their time" claim, if one exists.
5. Branding assets: logo, seal or badge files, colors and fonts.
6. Where form submissions should go, and who manages DNS and hosting.
7. A privacy policy and terms (not in the source material). These are needed once forms collect data.
8. The documents listed under Resources → Downloads, and the four other white papers.
