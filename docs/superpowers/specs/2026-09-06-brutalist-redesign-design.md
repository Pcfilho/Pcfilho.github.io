# Brutalist redesign: design spec

Date: 2026-09-06. Decided with Paulo in a grilling session. Reference site: https://diegovz.com/ (mirrored source and visual analysis live outside the repo, in the session scratchpad; the relevant tokens are copied into this spec so it stands alone).

## Goal

Replace the current warm, playful portfolio with a black, brutalist, developer-flavoured single page in the spirit of diegovz.com, built with Paulo's own portrait and the same entrance choreography, while keeping the interactive iPhone as the centrepiece that the reference does not have. Separate professional apps (inside the phone) from personal products (own section, founder voice), always framing Paulo as a senior mobile engineer.

## Non-goals (explicitly out of v1)

- Real app screens or videos inside the phone (phone keeps the icon to case-study model).
- Light theme.
- Writing, Education, Readings, Awards sections.
- Drawing canvas slot, particles, custom cursor.
- Naming Paulo's new employer anywhere. Copy stays impersonal: "Senior React Native / Mobile Engineer", no company.
- Any build step or framework.

## Decisions (numbered as in the grilling)

1. Stack: vanilla, no build. Split into `index.html`, `css/*.css`, `js/**/*.js` (native ES modules), data as JS modules. Served by GitHub Pages from `main` root. Preview via `python3 -m http.server` (ES modules need http, not file://).
2. Rewrite from scratch. Transplant the iPhone code (views, pager, edit mode, in-phone push, Dynamic Island) into `js/sections/phone.js`. Dog game returns as a bento slot (reuse `dog-game.core.js` untouched and `dog-game.js` with a slimmer mount).
3. Hero = portrait + giant headline, reference composition. Phone gets its own full-height section right after the hero.
4. Phone keeps the current model: home grid of professional app icons, tap opens the case study (problem / build / impact / store links) inside the phone. New dark skin. Second pager page keeps the off-duty widgets.
5. "My products" is a separate section with reference-style cards and a short founder manifesto. Products in v1: Daily Logs (live) and Nino (building).
6. Section order: Hero, Phone, My products, Fragments of me (bento), Experience, What colleagues say, Footer.
7. Bilingual EN/PT, EN default, persisted in `localStorage` key `pb_lang`. No light mode; `pb_theme` key is ignored and removed.
8. Type: Inter Tight (display, 700/800), Inter (text, 400/500/600), JetBrains Mono (mono, 400/500). Accent: orange `#FF6A1A`. `border-radius: 0` on every site element. The phone's inner UI is a simulated iOS device and keeps iOS rounding.
9. Bento slots v1: terminal, dog game, location, "thinker / builder / shipper", stack chips, numbers timeline.
10. Hero copy. EN: `Hi there` / `I am Paulo.` then `Shipping mobile apps since 2020` and `Senior React Native / Mobile Engineer`. PT: `Olá` / `Sou o Paulo.` then `Publicando apps mobile desde 2020` and `Engenheiro Mobile Sênior · React Native`. The final period of the headline is an orange square.
11. Experience: cards always open, max 3 bullets, mono stack tags, company logo square on the rail. Collective Health shows `01/2026 · 2026`, no "Present". Hero subtitle and the Experience list read from the same `profile`/`experience` data modules so a single edit updates both.
12. Motion: hero headline words rise with `translateY(100%)` to `0`, 0.8s, `cubic-bezier(0.15, 0.8, 0.25, 1)`, delays 0.4s / 0.6s / 1.2s / 1.3s; subtitle lines at 2.0s; portrait fades 0 to 1 over 1.2s starting at 0s. Each later section reveals once (opacity 0 to 1, translateY 12px to 0, 0.6s) via IntersectionObserver at 15% visibility. `prefers-reduced-motion: reduce` disables all of it (final state immediately). No particles, no custom cursor.
13. Portrait is pre-processed into `assets/hero-portrait.webp` (1000px wide) and `assets/hero-portrait@2x.webp` (2000px): grayscale, background crushed to `#000`, radial vignette, linear fade to transparent over the bottom 35%. Source stays in `assets/hero-portrait-src.png`.
14. Footer: left column with site name, tagline, mono links (email, LinkedIn, GitHub, CV PDF) and the GoatCounter visitor count; right column with the "send yourself a push" toy. Konami code kept (confetti + toast). GoatCounter script kept.
15. Responsive: breakpoints 1024px and 640px. Below 640px the phone frame disappears and its screen content renders as a native full-width block. Bento becomes one column. Experience rail disappears, cards stack with logo and years inline.
16. Process: branch `redesign-brutalist` in a worktree, PR with screenshots, nothing lands on `main` without Paulo's review.

## Visual system

Copied from the reference and adapted.

| Token | Value |
|---|---|
| `--bg` | `#000000` |
| `--fg` | `rgba(255,255,255,0.90)` |
| `--fg-2` | `rgba(255,255,255,0.60)` |
| `--fg-3` | `rgba(255,255,255,0.40)` |
| `--hair` | `rgba(255,255,255,0.25)` (rules under list rows) |
| `--line` | `rgba(255,255,255,0.10)` (every card and panel border, 1px solid) |
| `--fill-hover` | `rgba(255,255,255,0.04)` |
| `--fill-hover-2` | `rgba(255,255,255,0.07)` |
| `--accent` | `#FF6A1A` |
| `--font-display` | `'Inter Tight', 'Inter', system-ui, sans-serif` |
| `--font-text` | `'Inter', system-ui, sans-serif` |
| `--font-mono` | `'JetBrains Mono', ui-monospace, Menlo, monospace` |
| `--container` | `1140px` max width, `24px` side padding (`16px` under 640px) |
| Section title | Inter Tight 36px / 800 / letter-spacing -0.02em, followed by an orange square (`.sq`) instead of a period |
| Hero headline | Inter Tight `clamp(56px, 9vw, 120px)` / 800 / line-height 0.95 / letter-spacing -0.03em |
| Body | Inter 16px / 400 / line-height 1.55, `--fg-2` |
| Mono meta | JetBrains Mono 12px / 500 / letter-spacing 0.02em, `--fg-3` |
| Radius | `0` everywhere outside the phone screen |
| Shadows / gradients | none, except edge fades (mask-image) on marquees and the hero portrait |
| Dot grid panel | `background: radial-gradient(rgba(255,255,255,.10) 1px, transparent 1px) 0 0 / 20px 20px, rgba(255,255,255,.04)` |
| Hover | card background `--line` to `--fill-hover` in 0.3s; diagonal arrow `translate(4px, -4px)` in 0.2s |
| Diagonal arrow | inline SVG `<svg viewBox="0 0 24 24"><path d="M7 17 17 7M8 7h9v9"/></svg>`, stroke currentColor 1.5px, 20px |

## Page anatomy

### Header (fixed, 60px tall, `#000` with a 24px bottom fade)

Left: logo, a 24px orange square with a 10px white square at its bottom-right corner (CSS only), followed by `paulo.` in Inter Tight 700 16px. Right: `Based in Fortaleza, Brazil` (Inter 13px 600, `--fg`), under it a mono line `HH:MM GMT-3` ticking every 15s, then the EN / PT toggle as two mono buttons separated by a hairline (active one in `--fg`, inactive in `--fg-3`). No menu.

### Hero (`min-height: 100vh`)

Portrait as `background-image` of the hero container: `url(assets/hero-portrait.webp)`, `image-set` with the 2x, `no-repeat`, `top center`, `contain`, the container padded so the face sits in the upper third. Headline block starts at 42% of the viewport height, left aligned inside the container, two lines each wrapped in `.line` (overflow hidden) with an inner `.word` that animates. After `Paulo` an inline `.sq` orange square 0.22em wide. Subtitle: two lines, Inter 20px, first line `--fg-2` with the year in `--fg`, second line `--fg`. Under 640px the headline is `clamp(48px, 15vw, 80px)` and the portrait width is 120% centred.

### Phone stage (`min-height: 100vh`, centred)

Section title `Tap an app` (PT `Toca num app`) with a mono subtitle `4 apps shipped to the stores · pro work` (PT `4 apps publicados nas lojas · trabalho`). The phone frame: 360x740, `#0b0b0d`, radius 52px (device), 11px bezel, no glow, a single `1px solid var(--line)` outline. Screen wallpaper: `radial-gradient(circle at 30% 20%, #1a1a1a, #000 70%)` plus the dot grid at 24px. Profile card and widgets use `rgba(255,255,255,.08)` glass with `1px solid rgba(255,255,255,.14)`. App icons keep 15px iOS radius. Case-study view: `#0a0a0a` background, `--fg` text, section labels in mono uppercase `--fg-3`, impact block with a 2px orange left border. Dock keeps the four links (email, LinkedIn, phone, GitHub) in flat orange, blue, green and grey squares with 15px radius. Everything else in the phone is transplanted behaviour: live clock, two-page pager with dots and swipe, long-press jiggle and drag reorder with the deny push notification, Dynamic Island poke, coach-mark on the first icon until first tap.

Apps inside the phone (order persisted in `pb_apporder`): Collective Health, Pluma Finance, Ploomes CRM, Agrolite Gestor. Daily Logs leaves the phone and moves to My products.

### My products

Title `My products` (PT `Meus produtos`). Manifesto paragraph, Inter 20px `--fg`, max 640px:

EN: `I also build my own. Not for the side income: to feel the whole cycle. Backend, store review, analytics, support tickets at 11pm. It makes me a better engineer on someone else's product.`

PT: `Também construo os meus. Não pela renda extra: pra sentir o ciclo inteiro. Backend, review da loja, analytics, ticket de suporte às 23h. Isso me faz um engenheiro melhor no produto dos outros.`

Grid of two cards (1 column under 640px). Card: 1px `--line` border, 24px padding, 220px min height, hover fill. Left: app icon 96px with 22px radius (it is an app icon). Right: name (Inter Tight 22px 700), one-liner (Inter 16px `--fg-2`), mono status line (`LIVE · App Store + Web` or `BUILDING · Expo + NestJS + Postgres`), mono stack line, diagonal arrow top right linking to the product URL.

- Daily Logs: icon `assets/daily.webp`. EN one-liner `Offline workout tracker. Free, no ads, Live Activities and widgets in Swift.` PT `Treinos offline. Grátis, sem anúncios, Live Activities e widgets em Swift.` URL `https://apps.apple.com/us/app/daily-logs-offline-workouts/id6757203084`. Status EN `LIVE · App Store + Web`, PT `NO AR · App Store + Web`. Stack `Expo · SQLite · Drizzle · Swift`.
- Nino: icon `assets/nino.webp` (copied from the Nino repo icon). EN one-liner `Digital pet companion: AI cartoon of your pet, vaccine wallet, and an AI vet.` PT `Companheiro digital do pet: cartoon por IA, carteira de vacinas e um veterinário IA.` No public URL yet: arrow links to `https://github.com/Pcfilho`. Status EN `BUILDING · 600+ PRs in`, PT `EM CONSTRUÇÃO · 600+ PRs`. Stack `Expo · NestJS · Postgres · Turborepo`.

### Fragments of me (bento)

Title `Fragments of me` (PT `Fragmentos de mim`). Grid at >=1024px: `grid-template-columns: repeat(3, 1fr)`, `grid-auto-rows: 200px`, gap 24px. Between 640 and 1024: 2 columns. Under 640: 1 column, each slot 240px tall (dog game 300px). Every slot: 1px `--line` border, 24px padding, a heading (Inter 18px 600 `--fg`) and a caption (Inter 15px `--fg-2`) under the interactive area.

| Slot | Grid area (desktop) | Content |
|---|---|---|
| terminal | col 1, rows 1-2 | Fake terminal panel: traffic-light dots (grey, no colour), then typed lines in JetBrains Mono 12px: `> npx paulo@stack init`, `✓ Loaded 6 years of React Native.`, `✓ Shipped 4 apps to the stores.`, `✓ Wrote the E2E suite nobody had.`, `✓ Removing imposter module.`, `Success! Engineer deployed.` with a blinking block cursor. Types 30ms per char, 350ms between lines, starts when the slot enters the viewport, runs once. Heading `I ship, then I test. Then I ship again.` (PT `Eu publico, testo, publico de novo.`). |
| dog | cols 2-3, rows 1-2 | The beach fetch game canvas, landscape, filling the slot area above the caption. Heading `Bull plays fetch` (PT `O Bull busca a bolinha`), caption `Throw the ball. He never misses.` (PT `Joga a bola. Ele nunca erra.`). |
| numbers | col 1, row 3 | Auto-scrolling vertical list of mono stat rows that slows on hover: `90% fewer support tickets · Ploomes`, `70% faster deploys · Ploomes`, `91% fewer re-renders · Collective Health`, `75 to 16 min Android CI · Collective Health`, `500k+ members served · Collective Health`, `22% more app usage · Agrolite`. Heading `Numbers I stand behind` (PT `Números que eu assino`). |
| thinker | col 2, row 3 | Centred three-line text: `thinker.` (`--fg-3`), `builder.` (`--fg-2`), `shipper.` (`--fg`), Inter Tight 28px 600. No heading. |
| location | col 3, row 3 | Dot-grid panel with a single orange 8px square at 62% / 48% and a mono label `Fortaleza · 3.7°S 38.5°W · GMT-3`. Heading `Remote from the coast` (PT `Remoto, do litoral`). |
| stack | cols 1-3, row 4 | Chips in mono 12px with 1px `--line` border, 6px 10px padding, wrapping: React Native, TypeScript, Expo, EAS, Swift, Kotlin, Fabric, TurboModules, React Compiler, Reanimated, Zustand, TanStack Query, RealmDB, SQLite, Drizzle, Jest, Maestro, GitHub Actions, Bitrise, Firebase, Supabase, Sentry, RevenueCat, NestJS, Postgres. Heading `Stack` with caption `What I reach for.` (PT `O que eu uso.`). |

### Experience

Title `Experience` (PT `Experiência`). Desktop: a 1px `--line` vertical rail centred; entries alternate sides; the company logo (48px square, 1px `--line` border, image `object-fit: cover`, monogram fallback for Freelance) sits on the rail with company name (Inter 16px 600) and a mono period line beside it, on the opposite side of the card. Card: 1px `--line` border, 24px padding, role (Inter 18px 600), up to 3 bullets (Inter 15px `--fg-2`, square bullet `▪` in `--fg-3`), then mono tags. Order newest first: Collective Health (`01/2026 · 2026`), Fintech Freelance / Pluma (`03/2026 · 2026`), Ploomes (`05/2023 · 01/2026`), Agrolite (`01/2021 · 05/2023`), Freelance (`06/2020 · 01/2021`). Under 1024px: single column, logo and period inline above the card, no rail.

### What colleagues say

Title `What colleagues say` (PT `O que dizem sobre mim`). Three rows separated by hairlines. Row: quote (Inter 18px `--fg`, opening and closing quotes as text), then a mono line `Name · Role · Company · relationship`, and a `LinkedIn ↗` mono link to `https://www.linkedin.com/in/paulo-cesar-barroso/details/recommendations/`.

### Footer

Two columns (one under 640px). Left: logo square + `pcfilho.github.io/` (Inter Tight 18px 700), tagline `Mobile apps, backend and this site, all by me.` (PT `Apps mobile, backend e este site, tudo por mim.`), mono links row `email · linkedin · github · cv.pdf` (mailto:paulo.dev.85@gmail.com, LinkedIn profile, https://github.com/Pcfilho, assets/Paulo_Barroso_CV.pdf; external in new tab), then a mono line `You were visitor number N` filled from `https://pcfilho.goatcounter.com/counter/TOTAL.json` (hidden if the fetch fails). Right: heading `Send yourself a push` (PT `Manda um push pra você`), a text input (mono, 1px `--line`, black, max 60 chars, placeholder `Hire Paulo?`) and a `Send` button (orange square, black text); submitting shows an iOS-style notification banner fixed at the top of the viewport (dark glass, PB avatar square, `Paulo Barroso · now`, the message) for 3s. Empty input sends the placeholder text. Konami code (up up down down left right left right b a) triggers confetti in orange, white and grey plus a toast.

## Data modules

All copy lives in `js/data/*.js` as objects built with `L(en, pt)` from `js/i18n.js`. Rendering calls `t(value)` which returns the string for the current language (plain strings pass through). Every user-facing string exists in both languages. No U+2014 anywhere in the repo.

## Assets

Kept: `assets/collective.webp`, `pluma.webp`, `ploomes.webp`, `agrolite.webp`, `daily.webp`, `bull.webp`, `timtim.webp`, `portrait.webp` (small avatar in the phone profile card and push banner), `og.png` (regenerated later, out of v1), `Paulo_Barroso_CV.pdf`, `Paulo_Barroso_CV.html`, `assets/beach/*` (dog game sprites). Added: `hero-portrait-src.png`, `hero-portrait.webp`, `hero-portrait@2x.webp`, `nino.webp`. Removed: `wall.webp`.

## Verification

- `npm test` runs `node --test test/`: pure-function tests (i18n, data integrity, terminal script, numbers list) plus a repo-wide scan asserting no U+2014 in tracked text files.
- `npm run shoot` serves the site and captures `shots/desktop-{fold,full}.png` and `shots/mobile-{fold,full}.png` with headless Chrome via playwright-core (devDependency, not a build step). Screenshots are gitignored and attached to the PR.
- Manual: Maestri browser portal for interactive checks (swipe, long-press, push toy).
