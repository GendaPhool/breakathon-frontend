# Genda Phool Break-A-Thon — Landing Page Execution Plan

**Purpose of this document:** hand this directly to Claude Code as the build spec for a new marketing landing page for the Break-A-Thon app. Everything below was reverse-engineered from `breakathon.zip` (the real codebase, real Tailwind tokens, real CSS variables) and `PROJECT_DOCUMENTATION.md` (the real product logic) — nothing here is generic boilerplate. Two provided Lottie files are mapped to specific sections.

---

## 0. What this event actually is (read this first)

`Genda Phool` is a flower-subscription/delivery business. Its real product surface area (from the Prisma `BugCategory` enum) is: **Customer App, Admin Dashboard, Delivery Partner App, Production Dashboard, Route Management, Subscription Management, Payment System, Wallet System, Notification System.**

The **Break-A-Thon** is a live, in-person bug bounty event against that real product. Participants pay ₹149 to register, get checked in at the venue, then spend the event window finding and submitting bugs against those 9 modules. Marshals (organizers) triage submissions live; a public leaderboard ranks participants by points. This is a **competitive, gamified QA event**, not a hackathon that builds new things — the landing page copy must reflect "hunt bugs, earn points, climb the leaderboard," not "build a project."

This context should shape every section's copy below.

---

## 1. Extracted Design System (use exactly as-is — do not invent new tokens)

Source: `breakathon-frontend/src/index.css` + `tailwind.config.js`. The landing page **must** consume these same CSS variables so it's pixel-consistent with the rest of the app — zero new color tokens.

### Light theme (`:root`)
| Token | HSL | Approx Hex | Role |
|---|---|---|---|
| `--background` | 40 30% 96% | `#F7F2E8` | warm cream page background |
| `--foreground` | 218 45% 18% | `#1B2C45` | deep navy text |
| `--card` | 40 25% 99% | `#FDFCFA` | near-white card surface |
| `--primary` | 218 55% 30% | `#21426E` | deep navy — brand color |
| `--accent` | 210 80% 52% | `#1C82E0` | vivid blue — energy/CTA color |
| `--destructive` | 0 84% 60% | `#EF4444` | red — used for Launch Blocker severity |
| `--border` | 40 15% 87% | `#E3DDD0` | soft warm border |
| `--chart-1..5` | navy / blue / `15 70% 52%` (burnt orange) / `43 74% 55%` (gold) / `160 50% 45%` (green) | — | severity/data color ramp |
| `--radius` | 0.75rem | — | rounded-xl everywhere |

### Dark theme (`.dark`)
| Token | HSL | Approx Hex |
|---|---|---|
| `--background` | 218 40% 10% | `#0E1726` |
| `--foreground` | 40 25% 93% | `#EFE9DD` |
| `--primary` / `--accent` | 210 80% 55% | `#2E8AE6` |

**Key design decision for this build:** the **hero section uses the existing `.dark` token set** (deep navy `#0E1726` background, cream text, glowing blue accent) even though the rest of the site is light/cream. This is a deliberate, common premium-SaaS pattern (dark hero, light body) and it costs **zero new tokens** — `.dark` is already defined in `index.css`. It's also exactly the palette that makes a glowing 3D circuit/bug scene look good. Below the hero, the page returns to the light cream theme that the rest of the app uses.

### Typography
| Variable | Font | Use |
|---|---|---|
| `--font-display` | Playfair Display (italic, 700) | big editorial headline moments — "Hunt. Score. Win." |
| `--font-heading` | Space Grotesk | section titles, nav, buttons, numbers/stats |
| `--font-body` | Inter | paragraphs, form labels, body copy |

This pairing (serif-italic display + geometric-grotesk heading + Inter body) is an **editorial-tech** look — premium and warm, not a generic dark hacker/terminal bug-bounty theme. Lean into that: generous whitespace, big serif italic statements, confident navy/blue, not neon green/matrix.

### Brand mark
Existing mark = navy rounded-lg square (`rounded-lg bg-primary`) containing a white Lucide `Bug` icon. Reuse this exact mark in the landing nav for continuity — do not redesign the logo.

### Existing component idioms to reuse (don't reinvent)
- Pill badges: `bg-white/10 rounded-full px-3 py-1` (used for date/time/venue chips on the existing register page)
- Podium gradient colors already coded in `Leaderboard.jsx`: gold = `from-amber-400 to-yellow-500`, plus `Crown`/`Medal` icons from lucide
- Cards: `Card` / `CardContent` from the existing shadcn component library — reuse, don't rebuild

---

## 2. Stack decisions for the landing page

| Concern | Choice | Why |
|---|---|---|
| Framework | Same React 18 + Vite app, new route | Zero duplicate tooling, reuses Tailwind config + CSS vars + shadcn components already in repo |
| Scroll/reveal animation | **Framer Motion** | Already in the person's stack (per prior portfolio work); great for staggered text + viewport-triggered reveals |
| Complex/pinned timelines | **GSAP + ScrollTrigger** | For the "How It Works" scroll-driven path-draw and the points-system scroll sequence — Framer Motion alone gets clunky for scroll-scrubbed effects |
| 3D hero background | **React Three Fiber + @react-three/drei** | Declarative Three.js in React; person already uses Three.js elsewhere |
| Lottie playback | **`@lottiefiles/dotlottie-react`** | Plays `.lottie` files natively — no need to unzip the provided files, just drop them in `src/assets/lottie/` |
| Icons | `lucide-react` | Already the icon set used everywhere in the app |

### New dependencies to install
```bash
npm install framer-motion gsap @react-three/fiber @react-three/drei three @lottiefiles/dotlottie-react
```

### Where this lives in the existing repo
`breakathon-frontend/src/pages/Home.jsx` currently force-redirects every visitor away from `/`. Change it to only redirect **authenticated** users; anonymous visitors get the new landing page:

```jsx
// pages/Home.jsx
import { useAuth } from "@/lib/AuthContext";
import { getParticipantSession } from "@/lib/participantSession";
import { Navigate } from "react-router-dom";
import LandingPage from "./LandingPage";

export default function Home() {
  const { user } = useAuth();
  const participant = getParticipantSession();

  if (user?.role === "marshal") return <Navigate to="/marshal/queue" replace />;
  if (participant) return <Navigate to="/submit" replace />;
  return <LandingPage />;
}
```
This is the only existing file that needs a behavioral change. Every CTA on the new landing page points to **routes that already exist and already work**: `/event-register`, `/leaderboard`, `/user/login`. No backend changes, no new API routes.

### New file structure to create
```
breakathon-frontend/src/
├── pages/
│   └── LandingPage.jsx                 — composes all sections below
├── components/landing/
│   ├── Navbar.jsx
│   ├── HeroSection.jsx
│   ├── StatsTicker.jsx
│   ├── AboutSection.jsx
│   ├── ModulesSection.jsx              — the 9 bug-hunting modules
│   ├── HowItWorksSection.jsx           — scroll-pinned timeline
│   ├── PointsSystemSection.jsx         — severity → points visual
│   ├── LeaderboardPreviewSection.jsx
│   ├── MarshalsSection.jsx             — uses new_ting.lottie
│   ├── FAQSection.jsx
│   ├── FinalCTASection.jsx
│   └── Footer.jsx
├── components/motion/
│   ├── RevealText.jsx                  — word/line stagger reveal wrapper
│   ├── FadeInWhenVisible.jsx           — viewport fade/slide wrapper
│   └── CountUp.jsx                     — animated number counter
├── three/
│   ├── HeroScene.jsx                   — <Canvas> + lighting + camera rig
│   ├── BugCrawler.jsx                  — procedural low-poly bug mesh + path walk
│   └── circuitPath.js                  — the CatmullRom spline the bug walks
└── assets/lottie/
    ├── bug-hunting.lottie              — copy of Bug_Hunting.lottie (provided)
    └── developer-review.lottie         — copy of new_ting.lottie (provided)
```

---

## 3. The 3D Hero Background — full creative + technical spec

This is the centerpiece, so it gets its own section.

### Creative concept: "The Crack in the Surface"
The event is literally named **Break-A-Thon** — so the visual metaphor is *breaking the surface to find what's hiding underneath*, not a literal cartoon insect walking around.

**Scene:**
1. A dark navy plane (matches `.dark` `--background`, `#0E1726`) fills the background, lit with a soft grid of faint glowing lines — like a circuit board / blueprint, very low opacity (~8–12%) so it reads as texture, not noise.
2. A single **procedural low-poly bug** (built from primitives, no external 3D asset — see below) walks along a winding glowing path made with `THREE.CatmullRomCurve3` — the path itself is rendered as a thin glowing accent-blue (`#2E8AE6`) tube that snakes across the plane.
3. **Every few seconds the bug pauses, and a small crack/fissure opens beneath it** — a thin glowing line splits open in the grid, briefly revealing a brighter blue glow underneath, then closes — visually saying "found a bug." This is the one signature, ownable motion of the whole site.
4. Mouse movement drives a subtle parallax: the camera rig tilts a few degrees toward the cursor (`useFrame` lerp, never instant) — gives depth without disorienting.
5. A handful of translucent glass-like shard meshes (irregular low-poly tetrahedrons, accent-blue, low opacity, additive blending) drift slowly in the far background — "fragments" of the broken surface. Keep this to 6–10 meshes, instanced, cheap.
6. Foreground: a soft vignette + the cream/navy text sits on top in a fixed DOM layer (not in the 3D canvas) so text stays crisp and accessible regardless of canvas performance.

This avoids the over-literal "cartoon bug crawling on a leaf" look and instead reads as premium/tech — fitting the editorial-tech type system. It also gives you the option to literally have the bug-crack-reveal animation **trigger the headline's text reveal** (see §6) so the 3D background and the text choreography feel like one event, not two separate things bolted together.

### Why a procedural bug, not an imported 3D model
No bug GLTF/asset was provided, and sourcing one mid-build risks licensing issues and inconsistent style. Build a **minimalist low-poly beetle from primitives** — this also matches the "minimalist" brief better than a hyper-detailed imported model would:
- Body: two scaled `IcosahedronGeometry` (low detail) or `SphereGeometry` segments (thorax + abdomen), `MeshStandardMaterial` with a glassy navy/blue finish (`roughness: 0.25`, slight `emissive` in accent blue for rim glow).
- Legs: 6 thin `CylinderGeometry` segments, animated with a simple sine-wave gait offset per leg pair in `useFrame`.
- Antennae: 2 thin curved tubes (`TubeGeometry` on a small curve).
- Orientation: each frame, sample the spline at `t` and `t + ε`, point the bug's forward vector along the tangent (`lookAt`) so it always faces its direction of travel.

### Technical implementation notes
- `<Canvas dpr={[1, 1.5]}>` — cap pixel ratio, this is a background element, not the main content; never let it fight the main thread.
- Camera: low FOV (~35–40°), fixed distance, slight parallax only — no orbit controls exposed to the user.
- Path: define 6–8 control points once in `circuitPath.js`, loop with `curve.closed = true`, drive `t` via `useFrame` at a slow constant speed (full loop ≈ 25–35s) so it reads as ambient, not attention-grabbing.
- Lighting: one soft `ambientLight`, one `pointLight` that follows the bug (small accent-blue point light attached to the bug group) so the crack-glow moments actually light the grid beneath it — this sells the "found a bug" beat.
- **Performance gate:** wrap the whole `<Canvas>` in a check — `if (window.matchMedia('(max-width: 768px)').matches) render a static gradient + CSS-only glow instead of mounting the Canvas at all`. Mobile GPUs should never pay for this.
- **Reduced motion:** `useReducedMotion()` (Framer Motion hook) — if true, freeze the bug's `t` advance and disable camera parallax, but keep the static scene visible (don't hide it, just stop it moving).
- Keep all 3D code isolated in `src/three/` so it can be lazy-loaded (`React.lazy` + `Suspense`) and never blocks the rest of the page from rendering — text and CTAs must be interactive immediately even if the 3D scene is still warming up.

---

## 4. Lottie asset mapping

Two `.lottie` files were provided and inspected — here's what's actually inside each and where it belongs:

| File | What it actually contains | Native colors | Where to use it | Recolor needed? |
|---|---|---|---|---|
| `Bug_Hunting.lottie` | Magnifying glass + a bug (layers: `Magnifier Outlines`, `Bug`, `BG Outlines`) | coral/pink (`#e87f9b`, `#fc8eaa`) | **How It Works** section, on the "Submit your bug" step — the magnifier-finding-a-bug motion is a literal, perfect match for that step | Yes — recolor via `dotlottie`'s color slot override (or a one-time script swapping the `c.k` fill arrays) to accent blue `#1C82E0` + navy `#21426E` so it doesn't clash with the coral against the cream/navy palette |
| `new_ting.lottie` | A person at a desk with a cup, hand, head (layers: `man`, `cup`, `hand`, `head`) — reads as "someone reviewing/working at a screen" | already blue-leaning (`#0070bf`) plus orange/coral accents | **Marshals/Organizers** section — "Marshals review every submission live" — use it to depict the marshal triaging bugs at their desk | Minor — its existing `#0070bf` blue is already close to `--accent`; only the orange/coral accents need a light nudge toward the chart-3/chart-4 tokens for consistency, not a full recolor |

Implementation:
```jsx
import { DotLottieReact } from '@lottiefiles/dotlottie-react';
<DotLottieReact src="/src/assets/lottie/bug-hunting.lottie" loop autoplay />
```
Trigger both with viewport-enter (play once or loop softly) via the `FadeInWhenVisible` wrapper, not autoplay-on-load — keeps the page calm until the user scrolls to them.

---

## 5. Information Architecture (full section order)

1. **Navbar** — sticky, transparent over hero → solidifies (`bg-card/90 backdrop-blur-xl`) on scroll, same idiom as the existing `AppLayout` header. Logo mark + "Register Now" CTA always visible.
2. **Hero** — 3D background (§3) + editorial headline + two CTAs + live stat chips.
3. **Stats Ticker** — thin horizontal strip, animated counters: registration fee, modules in scope, severity tiers, live leaderboard refresh interval.
4. **About / What is this** — 2–3 sentence framing of Genda Phool's real product and why this event exists.
5. **What You'll Be Testing** — the 9 real modules as a grid of cards.
6. **How It Works** — scroll-pinned 5-step timeline (Register → Pay → Check In → Hunt → Get Scored), with the Bug_Hunting lottie on step 4/5.
7. **Severity & Points System** — visual breakdown of the 6 point tiers.
8. **Leaderboard & Live Rankings** — explains the ranking algorithm + a stylized podium preview (reuses real gold/silver/bronze gradient from `Leaderboard.jsx`).
9. **For Marshals** — short section on the organizer side, with the `developer-review.lottie`.
10. **FAQ** — accordion (reuse existing shadcn `Accordion` if present, else simple expandable list).
11. **Final CTA** — full-width navy band, big serif headline, single primary "Register for ₹149" button.
12. **Footer** — minimal, matches existing app's restrained footer style (if any) or a simple one: brand mark, nav links, copyright.

---

## 6. Section-by-section content + motion spec

For each section: **purpose → real content to use (from the docs, rewritten for a visitor, not a developer) → layout → animation directive.**

### 6.1 Navbar
- **Content:** Brand mark + "Break-A-Thon" wordmark · nav links scroll to `#about`, `#how-it-works`, `#leaderboard`, `#faq` · primary button "Register" → `/event-register` · secondary text link "Login" → `/user/login`.
- **Animation:** background opacity/blur fades in via `useScroll` (Framer Motion) once scrollY > 40px. Logo never animates — it's the one fixed anchor.

### 6.2 Hero
- **Headline (Playfair Display italic, large):** *"Hunt. Score. Win."* — or, on a second line in Space Grotesk regular weight: "A live bug bounty on a real product."
- **Subhead (Inter):** "Genda Phool is opening up its production apps — Customer App, Delivery, Payments, Wallet, and more — for one live hunt. Find real bugs, earn real points, climb the leaderboard."
- **CTAs:** Primary "Register — ₹149" → `/event-register`. Secondary (ghost/outline) "View Leaderboard" → `/leaderboard`.
- **Live chips (reuse pill idiom):** date / time / venue — bind these to the same `EventSettings` fields the rest of the app already reads (`event_date`, `event_time`, `venue`) via the existing `entities.EventSettings.list()` call, so the landing page never goes stale or needs hardcoded copy.
- **Animation:**
  - Headline: split into words, each word a `motion.span`, staggered `y: 24→0, opacity: 0→1`, `staggerChildren: 0.06`, custom ease `[0.16, 1, 0.3, 1]` (expo-out — confident, not bouncy).
  - Subhead + CTAs: fade up 150ms after headline finishes.
  - Tie the **first headline word's reveal** to the 3D scene's first "crack" beat if feasible (both fire ~0.4s after mount) — small touch, makes the page feel directed rather than assembled.

### 6.3 Stats Ticker
- **Content (all real numbers from the docs):** "₹149 Registration" · "9 Modules in Scope" · "6 Severity Tiers" · "60s Leaderboard Refresh" · "Top 3 take the Podium."
- **Layout:** thin horizontal band, 4–5 items, dividers between them (`border-r border-border`).
- **Animation:** `CountUp` component — numbers count from 0 to target over ~1.2s when the band enters viewport, `IntersectionObserver`-gated so it never re-fires on every scroll.

### 6.4 About
- **Content (rewritten from doc §1–3):** "Running a bug-hunting competition by spreadsheet doesn't scale. So we built a real platform for it: self-service registration with online payment, a live marshal dashboard, structured bug submission with duplicate-awareness, and a public leaderboard that updates while the event is still running." Frame this as *why the event feels this polished*, not as a backend description.
- **Layout:** two-column — left short paragraph, right a simple stat card or the floating shard visual bleeding in from the hero.
- **Animation:** `FadeInWhenVisible` slide-up, single block, no stagger needed here — this section should feel calm after the hero's energy.

### 6.5 What You'll Be Testing (the 9 modules)
- **Content — use these exact, real module names, just relabeled for humans:**
  Customer App · Admin Dashboard · Delivery Partner App · Production Dashboard · Route Management · Subscription Management · Payment System · Wallet System · Notification System.
- **Layout:** 3×3 (or 3×3 responsive→2×col on tablet, 1×col on mobile) grid of cards, each with a small lucide icon (e.g. `Smartphone`, `LayoutDashboard`, `Truck`, `Factory`, `Map`, `Repeat`, `CreditCard`, `Wallet`, `Bell`) + module name + one-line hint of what lives there.
- **Animation:** GSAP `ScrollTrigger` batch-reveal — cards fade/scale in in a staggered grid pattern (row-by-row) as the section enters viewport, not all-at-once.

### 6.6 How It Works (the real flow, from doc §13 + §19 + §9)
Five real steps, rewritten for a participant:
1. **Register** — fill in your details, pick how you heard about us.
2. **Pay ₹149** — secure Razorpay checkout, instant confirmation email.
3. **Check In** — show up, get verified at the desk, receive your Participant ID.
4. **Hunt** — once the marshal starts the event, pick a module, check the duplicate list, and submit: title, steps to reproduce, expected vs actual behavior, a required screenshot (+ optional screen recording).
5. **Get Scored** — a marshal validates your bug, assigns severity, and your points hit the live leaderboard.
- **Layout:** vertical timeline, sticky/pinned via GSAP `ScrollTrigger` (`pin: true`) — a connecting line literally draws itself (`strokeDashoffset` animated 0→full) as the user scrolls past each of the 5 steps, each step's card animating in as the line reaches it.
- **Lottie placement:** drop the recolored `bug-hunting.lottie` next to step 4 or 5 — the magnifier-finds-bug motion lands exactly on "Hunt" / "Get Scored."
- **Animation:** this is the GSAP-heaviest section in the whole page — budget the most build time here.

### 6.7 Severity & Points System (real data from doc §15 — do not alter these numbers)
| Severity | Points | Suggested color token |
|---|---|---|
| Launch Blocker | 15 | `--destructive` (red) |
| Critical | 10 | `--chart-3` (burnt orange) |
| High | 7 | `--chart-4` (gold) |
| Medium | 4 | `--accent` (blue) |
| Low | 1 | `--chart-5` (green) |
| Duplicate | 0.5 | `--muted-foreground` (gray) |
- **Framing copy:** "Every validated bug earns points based on how badly it would hurt the product. The worse the break, the more it's worth." Mention plainly: rejected bugs score 0, duplicates still earn a small 0.5 for being thorough.
- **Layout:** horizontal bar-chart style visual — six bars, length proportional to points, color-coded per the table, label + point value per bar.
- **Animation:** bars grow from `width: 0%` to target width on scroll-enter, staggered top→bottom, eased; pair with a `CountUp` on each point value so "15" visibly counts up as the bar fills.

### 6.8 Leaderboard & Live Rankings (real algorithm from doc §16 — copy must be accurate)
- **Framing copy:** "Ranked by total points from every validated and duplicate bug. Ties are broken by who validated more reports. Top 3 take the podium. The board refreshes every 60 seconds — while the event is live, so are you." Mention the organizer can hide it before the event starts, but don't dwell on that — it's a visitor-facing page.
- **Layout:** a **stylized, static preview podium** (3 illustrative placeholder names, clearly labeled "preview" or using fictional sample names) using the exact same gold/silver/bronze gradient classes already coded in `Leaderboard.jsx` (`from-amber-400 to-yellow-500` for gold, etc.) plus `Crown`/`Medal` icons — visual continuity with the real in-app leaderboard the participant will eventually see.
- **CTA:** "View Live Leaderboard" → `/leaderboard` (real, working route).
- **Animation:** podium bars rise from `scaleY: 0` (transform-origin bottom) staggered center-first (rank 1 rises first, then 2, then 3) — small dramatic beat, not overdone.

### 6.9 For Marshals
- **Framing copy:** "Behind every submission is a marshal reviewing it live — checking severity, catching duplicates, keeping the board fair while the event is still running." Keep this short; it's flavor/credibility, not a CTA section.
- **Lottie placement:** `developer-review.lottie` here, sized modestly (not hero-scale).
- **Animation:** simple fade/slide-in, no scroll-pin needed — this section should feel like a quieter beat after the Leaderboard section's energy.

### 6.10 FAQ
Suggested real questions (grounded in actual gating logic from doc §17, don't invent policies):
- "What if registration closes before I sign up?" → explain the deadline + participant cap logic plainly.
- "Can I submit bugs before the event officially starts?" → no, submissions open once a marshal starts the event.
- "What happens if someone else already reported my bug?" → explain duplicate-awareness + 0.5pt duplicate scoring.
- "How do I log in to submit bugs?" → email + phone number, no password needed.
- "Is the leaderboard live during the event?" → yes, auto-refreshes every 60 seconds (unless the organizer hides it).
- **Layout:** accordion, one open at a time.
- **Animation:** height auto-animate (Framer Motion `AnimatePresence` + `layout`), chevron rotates 180° on open.

### 6.11 Final CTA
- **Content:** full-bleed navy/dark band (reuse the `.dark` tokens again — bookends the page, echoes the hero). Big Playfair italic line: *"The bugs are waiting."* Button: "Register for ₹149" → `/event-register`.
- **Animation:** the same word-stagger reveal used in the hero headline (§6.2) — reuse the `RevealText` component, this repetition is intentional, it's a closing rhyme with the opening.

### 6.12 Footer
- Brand mark, a few nav anchors, copyright line. No animation needed — let the page rest here.

---

## 7. Reusable motion primitives to build first

Build these three before touching any section — every section above depends on them:

1. **`RevealText`** — takes a string, splits into words, staggers them in via Framer Motion `variants` + `staggerChildren`. Used in Hero headline + Final CTA headline.
2. **`FadeInWhenVisible`** — generic `motion.div` wrapper using `whileInView` + `viewport={{ once: true, amount: 0.3 }}`, slide-up 24px + fade. Used everywhere else as the default section-enter animation.
3. **`CountUp`** — numeric counter, animates from 0 → target over a given duration once visible (`IntersectionObserver` or `whileInView`). Used in Stats Ticker + Points System bars.

Standardize on one easing curve across the whole page: `[0.16, 1, 0.3, 1]` (expo-out). Don't mix easing styles between sections — it's what makes the whole page feel like one motion system instead of a pile of separate animations.

**Global rule:** every animated component must respect `prefers-reduced-motion` — wrap the easing/duration choice behind Framer Motion's `useReducedMotion()` and fall back to instant opacity-only transitions when true. Apply this rule to the 3D scene too (§3).

---

## 8. Build order (give this to Claude Code as the actual execution sequence)

1. **Scaffold** — install dependencies (§2), create the folder structure (§2), wire `Home.jsx` to conditionally render `LandingPage`.
2. **Motion primitives** — build `RevealText`, `FadeInWhenVisible`, `CountUp` (§7) in isolation, sanity-check each with a throwaway test render.
3. **Static layout pass** — build every section in §5–6 with real copy and the design tokens from §1, **no animation yet, no 3D yet**. Get the whole page scrolling top to bottom, responsive, correct content, correct colors/fonts. This is the checkpoint to verify content accuracy against this doc before animating anything.
4. **Lottie integration** — drop both `.lottie` files into `src/assets/lottie/`, recolor `bug-hunting.lottie` per §4, wire both into their sections.
5. **Scroll animation pass** — apply `FadeInWhenVisible`/`CountUp` everywhere per §6, then build the heavier GSAP `ScrollTrigger` work for How It Works (§6.6) and the bar-chart fill in Points System (§6.7).
6. **Hero text + Final CTA text** — wire `RevealText` into both headline spots.
7. **3D hero scene** — build `circuitPath.js` → `BugCrawler.jsx` → `HeroScene.jsx` last, behind a `React.lazy`/`Suspense` boundary, with the mobile/perf gate and reduced-motion freeze from §3 built in from the start, not bolted on after.
8. **Responsive pass** — test at 375px, 768px, 1024px, 1440px. The 3D canvas and GSAP pin sections need explicit mobile fallbacks (§3) — verify they actually trigger.
9. **Accessibility pass** — keyboard focus order through nav/CTAs, `prefers-reduced-motion` actually disables what it should, alt text / aria-labels on icon-only buttons, color contrast check on navy-on-cream and cream-on-navy text pairs.
10. **Perf pass** — Lighthouse/Web Vitals check, confirm the 3D scene doesn't block first paint, confirm lottie files aren't autoplaying off-screen.

---

## 9. Things to deliberately avoid

- Don't invent new colors, fonts, or a new logo — every token needed already exists in `index.css` / `tailwind.config.js` (§1).
- Don't invent fake "schedule of the day" times — the doc doesn't specify an event-day run-of-show, so the How It Works timeline (§6.6) is built around the real *process* flow, not a fabricated hour-by-hour agenda. If a real schedule exists, slot it in as a 13th section later — don't guess one for this build.
- Don't change any backend route, API, or Prisma schema — this is a pure frontend marketing page that links into routes that already work.
- Don't make the 3D bug literally cartoonish/cute — keep it low-poly/glassy and let the "crack in the surface" beat (§3) carry the personality, in line with the "minimalist and professional" brief.
- Don't autoplay both Lottie files immediately on page load — gate them to viewport-enter so the page feels paced, not noisy.
