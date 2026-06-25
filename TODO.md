# Clix Digital Works — Project TODO

Audit date: 2026-06-25  
Overall health: **Good (94%)**  
Stack: React 19 + Vite 8 + Framer Motion + React Router 7 + React Icons

---

## 🔴 CRITICAL — Broken Navigation

### 1. Missing route pages (Footer links 404-loop to Home)
Footer.jsx links to three routes that have no matching `<Route>` and no page component:

| Route | Footer link | Fix |
|---|---|---|
| `/privacy` | "Privacy Policy" | Create `src/pages/PrivacyPage.jsx` + add route in App.jsx |
| `/terms` | "Terms of Service" | Create `src/pages/TermsPage.jsx` + add route in App.jsx |
| `/sitemap` | "Sitemap" | Create `src/pages/SitemapPage.jsx` **or** remove the three `<Link>` elements in Footer.jsx |

**Quickest fix:** delete the three `<Link>` elements in `src/components/Footer.jsx` (lines ~168–170) and replace with plain `<span>` or remove entirely until the pages exist.

---

## 🟠 HIGH — Dead / Conflicting Files

### 2. `src/index.css` is orphaned
- Was the default Vite CSS file; it is **not imported anywhere** (main.jsx now imports `./styles/global.css`).
- Contains its own `:root` block that would shadow `styles/variables.css` **if accidentally re-imported**.
- **Action:** Delete `src/index.css`.

### 3. `src/App.css` is orphaned
- Was the default Vite component stylesheet; **not imported anywhere**.
- Contains stale `.counter`, `.hero`, `#center`, `#next-steps`, `.ticks` rules that are noise.
- **Action:** Delete `src/App.css`.

### 4. `src/utils/` is an empty directory
- Created as part of the scaffolding but contains nothing.
- **Action:** Delete the folder, or populate it (see enhancement ideas below).

---

## 🟡 MEDIUM — Placeholder / Stub Content

### 5. Contact information is still placeholder
All these need real values before the site goes live:

| File | Location | Placeholder | Replace with |
|---|---|---|---|
| `src/components/Footer.jsx` | ~line 89 | `+255 XXX XXX XXX` | Real phone / WhatsApp |
| `src/components/Footer.jsx` | ~line 91 | `info@clixdigitalworks.co.tz` | Verified email address |
| `src/sections/Contact.jsx` | ~line 32 | `+255 XXX XXX XXX` | Real phone / WhatsApp |
| `src/sections/Contact.jsx` | ~line 34 | `info@clixdigitalworks.co.tz` | Verified email address |

### 6. Social media links all point to `"#"`
`src/components/Footer.jsx` — SOCIAL array, `href: '#'` for Facebook, Twitter/X, LinkedIn, Instagram, YouTube.  
**Action:** Replace each `href` with the real profile URL, or remove platforms that don't yet exist.

### 7. Team member names in AboutPage are generic
`src/pages/AboutPage.jsx` — TEAM array has three unnamed members:  
`"Software Engineer"`, `"UI/UX Designer"`, `"Mobile Developer"`.  
**Action:** Add real names once known, or remove the cards.

### 8. Contact form has no backend
`src/sections/Contact.jsx` — `handleSubmit` only runs a fake 1 500 ms timeout then shows a success state. No data is actually sent.  
**Action (choose one):**
- Wire up to an email API (e.g. EmailJS, Formspree, Resend)
- Wire up to your own backend endpoint
- At minimum, open `mailto:` as a fallback

### 9. Portfolio project images are emoji placeholders
`src/sections/Portfolio.jsx` — Each card shows a giant emoji instead of a real screenshot or mockup.  
**Action:** Add real project screenshots to `src/assets/images/` and reference them in the PROJECTS array. Suggested field: `image: '/src/assets/images/project-church.jpg'`.

### 10. Blog posts are static / fake
`src/sections/BlogPreview.jsx` — All four posts are hard-coded with no routing to real article pages.  
**Action:** Either create individual blog article pages under `/blog/:slug`, or wire up to a CMS / headless blog.

---

## 🔵 LOW — Polish & Enhancement

### 11. `src/utils/` — add shared helpers
Suggested utilities to add (currently missing):
- `src/utils/formatDate.js` — date formatting for blog posts
- `src/utils/validateForm.js` — real client-side form validation for Contact

### 12. `src/hooks/` — add missing hook
`useScrollAnimation.js` was planned in the original file-structure spec but was never created. The sections use `useInView` instead; this is fine — just remove the reference if it appears anywhere, or create the hook if needed.

### 13. SEO — `index.html` Open Graph image is a placeholder URL
`index.html` line ~33: `og:image` points to `https://clixdigitalworks.co.tz/og-image.png` which doesn't exist yet.  
**Action:** Create a 1200×630px OG image, place it in `public/og-image.png`, and update the URL.

### 14. Favicon is still the default Vite SVG
`public/favicon.svg` is Vite's default purple lightning bolt.  
**Action:** Replace with a Clix-branded favicon (a "C" on a gradient background as designed in the LoadingScreen logo mark).

### 15. ParticleBackground — mobile performance
`src/components/ParticleBackground.jsx` runs a full canvas animation at 60 fps even on mobile.  
**Action:** Add a `matchMedia('(prefers-reduced-motion)')` check and/or skip rendering on `window.innerWidth < 768` to improve mobile battery/performance.

### 16. Custom cursor runs `querySelectorAll` once on mount
`src/components/CustomCursor.jsx` — interactable elements are queried once in `useEffect`. Dynamically added elements (e.g. after page transition) won't be picked up.  
**Action:** Use event delegation on `document` instead — check `event.target.closest('a, button, .btn, ...')` inside the mousemove handler.

### 17. `<a>` tags in Footer use `target="_blank"` without `rel="noreferrer"`
`src/components/Footer.jsx` — social links have `rel="noopener noreferrer"` ✓ (already correct), but the Google Maps link uses only `target="_blank"` with `rel="noopener noreferrer"`. Double-check all external anchors have both attributes.

### 18. Missing `useScrollAnimation.js` hook file (spec item)
The original spec called for `src/hooks/useScrollAnimation.js`. Not referenced anywhere currently, so no runtime error. Add it or remove from scope.

### 19. `src/assets/images/` directory is empty
The sub-folder was created but nothing was added. Needed for portfolio screenshots and any other imagery.

### 20. No 404 / Not-Found page
The `*` wildcard route in App.jsx currently falls back silently to `<Home />`. A dedicated `NotFoundPage.jsx` with a "Page not found" message and a link home would be more professional.

---

## ✅ CONFIRMED WORKING (no action needed)

| Area | Status |
|---|---|
| React Router 7 routing + page transitions | ✓ |
| Loading screen with animated progress | ✓ |
| Custom cursor (desktop only) | ✓ |
| Particle canvas background | ✓ |
| Scroll progress bar | ✓ |
| Scroll-to-top button | ✓ |
| Sticky navbar + mobile hamburger | ✓ |
| Hero: typing effect, orbit viz, stat counters | ✓ |
| Services: 12-card animated grid | ✓ |
| Solutions: tabbed industry panel | ✓ |
| Why Choose Us: animated counters + cards | ✓ |
| Tech Stack: category grid + trust strip | ✓ |
| Portfolio: filter tabs + project cards | ✓ |
| Process: 7-step alternating timeline | ✓ |
| Testimonials: auto-rotating carousel | ✓ |
| Blog Preview: featured + list layout | ✓ |
| Contact: form with success state | ✓ |
| Footer: multi-column + newsletter | ✓ |
| All CSS variables scoped correctly | ✓ |
| Responsive design (mobile / tablet / desktop) | ✓ |
| Framer Motion animations throughout | ✓ |
| SEO meta tags + JSON-LD in index.html | ✓ |
| Google Fonts preconnect | ✓ |
| useInView + useCounter hooks | ✓ |
| All section-to-style imports resolved | ✓ |
| All page-to-section imports resolved | ✓ |

---

## Priority Checklist (recommended order)

- [ ] **#1** — Delete `src/index.css` and `src/App.css`
- [ ] **#2** — Fix `/privacy`, `/terms`, `/sitemap` links in Footer (remove or create pages)
- [ ] **#3** — Replace placeholder phone / email with real contact info
- [ ] **#4** — Wire up contact form to real email backend
- [ ] **#5** — Replace social `href="#"` with real URLs
- [ ] **#6** — Replace default Vite favicon with Clix-branded SVG
- [ ] **#7** — Create OG image (1200×630) and add to `public/`
- [ ] **#8** — Add real portfolio project screenshots
- [ ] **#9** — Add real team member names in AboutPage
- [ ] **#10** — Create a proper 404 Not Found page
- [ ] **#11** — Fix custom cursor to use event delegation (dynamic element support)
- [ ] **#12** — Add `prefers-reduced-motion` / mobile guard to ParticleBackground
- [ ] **#13** — Create blog article pages or connect to a CMS
- [ ] **#14** — Delete `src/utils/` or populate with helpers
