# Dan Zauvek Festival Website — Design Brief

## Reference
The user's own poster design is the ground-truth visual reference:
- Black background (#0D0D0D / #111)
- White brush-stroke "DAN ZAUVEK" logotype
- Orange accent (#F5A623 / #E8950A) — brushstroke underline, date, highlights
- Real guitarist photo integrated into hero
- Bold, energetic, festival character

## Chosen Approach: FESTIVAL NOIR × ORANGE FIRE

### Design Movement
Dark festival branding — EXIT, Glastonbury, Nišville energy. Raw, powerful, authentic.

### Core Principles
1. **Black is the canvas** — deep #0D0D0D background everywhere, never grey
2. **Orange is the fire** — single accent color, used sparingly but boldly
3. **Photography is the hero** — real concert photos dominate, text supports
4. **Scroll is the journey** — each section has its own atmosphere

### Color Philosophy
- Background: `#0D0D0D` (near-black, not pure black)
- Primary accent: `#F5A623` (warm amber-orange — matches poster exactly)
- Text: `#FFFFFF` primary, `rgba(255,255,255,0.6)` secondary
- Cards/surfaces: `rgba(255,255,255,0.04)` — barely-there glass
- Borders: `rgba(255,255,255,0.08)`

### Typography System
- **Display/Logo**: Permanent Marker or Caveat (brush feel matching poster)
- **Headlines**: Montserrat 900 — bold, condensed, festival energy
- **Body**: Inter 400/500 — clean, readable
- **Accent labels**: Inter 700, letter-spacing 3px, uppercase

### Layout Paradigm
- Full-viewport hero with guitarist photo
- Asymmetric sections — alternating left/right content
- Wide horizontal program grid
- Masonry-style gallery

### Signature Elements
1. Orange brushstroke underline on key headings
2. Superscript-style day numbers (01. / 02.)
3. Corner bracket decorations on cards

### Animation
- Fade-in-up on scroll (Framer Motion)
- Countdown digits flip animation
- Smooth scroll between sections
- Nav background transition on scroll

### Brand Essence
"Dan Zauvek is not a memorial — it is a celebration of music, friendship and continuity through 13 years of tradition."

### Sections (in order)
1. **Nav** — sticky, transparent → opaque on scroll, brush logo left, orange CTA right
2. **Hero** — full viewport, guitarist photo, countdown timer, date + location
3. **Info strip** — 4 icons: 2 dana, žanrovi, generacije, ulaz slobodan
4. **Program** — two-day schedule with orange day headers
5. **Lineup** — bend cards with photo, name, genre, time
6. **O festivalu** — story, mission, slogan
7. **Galerija** — masonry photo grid from previous years
8. **Arhiva** — year-by-year accordion (2009–2025)
9. **Volonteri** — contact form
10. **Footer** — logo, social links, Google Maps, sponsors

## Style Decisions
- Dark theme throughout, no light mode
- Orange used only for: accents, CTAs, day headers, hover states
- All section transitions use subtle gradient fades
- Mobile-first, hamburger menu on mobile
