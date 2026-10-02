---
version: alpha
name: Warm Off-White Editorial Mobile
description: A warm, editorial mobile aesthetic built on a near-white canvas (#F7F7F5) with crisp white floating cards, restrained zinc-grey typography, and a single confident coral accent reserved for the primary action and one signature stat. Inter handles all UI text in Medium weight as the workhorse, while Inter Tight provides slightly tighter, more compressed numerals and headlines for a quietly editorial feel. Soft, low-opacity shadows do all the elevation work — there are no borders on cards, no heavy dividers, and no decorative chrome. Tiny uppercase eyebrow labels with wide tracking act as the section voice; everything else is calm, generous, and breathable.
colors:
  primary: "#FF5A5F"
  on-primary: "#FFFFFF"
  primary-hover: "#FA4F54"
  surface: "#FFFFFF"
  surface-alt: "#F7F7F5"
  surface-sunken: "#F4F4F5"
  on-surface: "#18181B"
  on-surface-variant: "#71717A"
  on-surface-muted: "#A1A1AA"
  on-surface-faint: "#D4D4D8"
  illus-moss: "#708D81"
  illus-amber: "#F4D35E"
  illus-clay: "#D98363"
typography:
  display-lg:
    fontFamily: Inter Tight
    fontSize: 32px
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: -0.02em
  numeral-lg:
    fontFamily: Inter Tight
    fontSize: 28px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.02em
  numeral-md:
    fontFamily: Inter Tight
    fontSize: 26px
    fontWeight: 500
    lineHeight: 1
    letterSpacing: -0.02em
  headline-lg:
    fontFamily: Inter
    fontSize: 26px
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: -0.02em
  body-lg:
    fontFamily: Inter
    fontSize: 17px
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: 0.01em
  body-md:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0em
  body-sm:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: 500
    lineHeight: 1.4
    letterSpacing: 0em
  caption:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: 500
    lineHeight: 1.3
    letterSpacing: 0em
  label-uppercase:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.15em
  label-uppercase-xs:
    fontFamily: Inter
    fontSize: 9px
    fontWeight: 700
    lineHeight: 1.2
    letterSpacing: 0.15em
rounded:
  sm: 8px
  md: 20px
  lg: 24px
  full: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 32px
  gutter: 24px
  card-padding: 24px
  section-gap: 32px
icons:
  set: lucide
  default_variant: line
  active_variant: line
  stroke_weight: 1.5px
  active_stroke_weight: 2px
  default_size: 20px
  nav_size: 24px
components:
  card:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.lg}"
    padding: 24px
    shadow: "0 8px 30px rgba(0, 0, 0, 0.03)"
  card-compact:
    backgroundColor: "{colors.surface}"
    rounded: "{rounded.md}"
    padding: 20px
    shadow: "0 8px 30px rgba(0, 0, 0, 0.03)"
  button-primary:
    backgroundColor: "{colors.primary}"
    textColor: "{colors.on-primary}"
    typography: "{typography.body-lg}"
    rounded: "{rounded.full}"
    paddingY: 16px
    paddingX: 24px
    shadow: "0 4px 14px rgba(255, 90, 95, 0.3)"
    pressedBackground: "{colors.primary-hover}"
  button-icon-ghost:
    textColor: "{colors.on-surface-muted}"
    iconSize: 20px
    size: 24px
  list-row:
    backgroundColor: transparent
    paddingY: 12px
    paddingX: 12px
    gap: 16px
    rounded: "{rounded.md}"
    pressedBackground: "rgba(0,0,0,0.04)"
  badge-circle:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.on-surface}"
    size: 48px
    rounded: "{rounded.full}"
    borderColor: "rgba(0,0,0,0.02)"
    borderWidth: 1px
    iconSize: 20px
    shadow: "0 2px 10px rgba(0,0,0,0.04)"
  progress-bar:
    backgroundColor: "{colors.surface-sunken}"
    height: 6px
    rounded: "{rounded.full}"
  progress-ring:
    trackColor: "{colors.surface-sunken}"
    progressColor: "{colors.primary}"
    strokeWidth: 8px
    size: 110px
  tab-bar:
    backgroundColor: "rgba(255,255,255,0.85)"
    rounded: "{rounded.full}"
    paddingX: 24px
    paddingY: 16px
    shadow: "0 12px 40px rgba(0, 0, 0, 0.08)"
    borderColor: "rgba(255,255,255,0.6)"
    borderWidth: 1px
    backdropBlur: 24px
  tab-item-active:
    iconColor: "{colors.primary}"
    indicatorColor: "{colors.primary}"
    indicatorSize: 4px
    iconSize: 24px
  tab-item-inactive:
    iconColor: "{colors.on-surface-faint}"
    iconSize: 24px
---

# Warm Off-White Editorial Mobile

## Overview

**Quiet, warm, editorial.** This aesthetic is built around a paper-like off-white canvas, crisp white floating cards, and a single saturated coral that earns its loudness by appearing only once or twice per screen. The result feels closer to a printed lifestyle magazine than a typical app: generous whitespace, restrained ink, and tiny tracked-out eyebrows that act as section voice.

The personality is **considered, not playful**. There are no gradients, no glassmorphism (except one floating tab bar), no decorative illustrations, and no heavy outlines. Hierarchy is built almost entirely through type weight, type size, and careful greyscale layering — coral is a punctuation mark, not a theme.

The mood targets users who want their tools to feel calm and high-signal. Dense data is allowed, but it must breathe — every card has air around it, every number gets its own line of sight.

## Colors

The palette is **light mode only**, structured as three tiers:

- **Canvas & surfaces** — `{colors.surface-alt}` (#F7F7F5) is the warm off-white page background; `{colors.surface}` (#FFFFFF) is the floating-card fill. The contrast between these two is intentionally tiny — the cards lift through shadow, not color. `{colors.surface-sunken}` (#F4F4F5) is reserved for inert progress-track fills inside cards.
- **Ink scale** — four cool zinc greys: `{colors.on-surface}` for primary content, `{colors.on-surface-variant}` for secondary text, `{colors.on-surface-muted}` for eyebrows and tertiary metadata, and `{colors.on-surface-faint}` for de-emphasized fragments (the "/5" inside a "3/5", inactive tab icons, faint chevrons).
- **Brand accent** — `{colors.primary}` (#FF5A5F coral) is the only saturated color in chrome. Use it for the primary CTA, the active progress-ring stroke, the active tab icon + indicator dot, and at most ONE numeral per screen for emphasis. Never use it as a card background, never tint text broadly, never combine it with another saturated color.

The **illustration palette** (`illus-moss`, `illus-amber`, `illus-clay`) is a separate, muted, earthy trio reserved for categorical data visualization — segmented progress bars, category dots, multi-series chart fills. These colors must NEVER appear in chrome (buttons, nav, headings) and the chrome ink scale must NEVER appear inside data visualizations beyond track-grey backgrounds.

## Typography

Two faces, both from Google Fonts:

- **Inter** is the workhorse for all UI text. Medium (500) is the default for body, labels, and metadata. Semibold (600) appears on the primary CTA. Bold (700) is used exclusively for the tracked-out uppercase eyebrows.
- **Inter Tight** handles all prominent numerals and the largest headline. Its tighter glyph widths give numbers an editorial, almost magazine-like compression. Always Medium (500) — never Bold — to keep large numerals elegant rather than shouty.

Token roles:

- `{typography.display-lg}` — large card headlines that anchor a section (the "what this card is about" title).
- `{typography.headline-lg}` — primary screen greeting / page title.
- `{typography.numeral-lg}` and `{typography.numeral-md}` — oversized data numerals inside stat tiles and progress rings. The role is distinct from `display-lg` because these sit alone, not as headlines.
- `{typography.body-lg}` — primary CTA text only.
- `{typography.body-md}` — list-row primary line, inline meta with icons.
- `{typography.body-sm}` — secondary list-row text, small inline values inside meta.
- `{typography.caption}` — value-pair fragments like "112 / 160g".
- `{typography.label-uppercase}` — the signature voice of this aesthetic. Tiny (10px), 700 weight, 0.15em tracking, fully uppercase, always in `{colors.on-surface-muted}`. Used as section eyebrows, card kickers, and date stamps. The wide tracking is load-bearing — never tighten it.
- `{typography.label-uppercase-xs}` — same treatment at 9px for compact stat-tile captions where space is tight.

**Tracking philosophy:** display and headline sizes pull tight (-0.02em) for an editorial feel; body sits neutral; uppercase labels push wide (0.15em). Never apply tight tracking to body or wide tracking to non-uppercase text.

**Weight strategy:** Medium 500 dominates. Bold 700 is reserved for uppercase labels only. Semibold 600 only appears on the primary CTA. This keeps the page calm even when information-dense.

## Spacing & Layout

**Density: balanced, leaning airy.** Side gutters are generous (`{spacing.gutter}` = 24px). Cards have generous internal padding (`{spacing.card-padding}` = 24px) so content never feels pinched. Vertical rhythm between sections is `{spacing.xl}` (32px); between a card and the section that follows, `{spacing.lg}` (24px) is acceptable when sections are visually distinct.

Within a card, inline meta items separate by `{spacing.lg}` (24px) — wider than typical — to give each item room to breathe. Icon-to-text gaps in inline meta are `{spacing.sm}` (8px). List-row icon-to-text gap is `{spacing.md}` (16px).

The page is one centered column with a fluid max width sized for mobile. Avoid multi-column layouts inside cards; the aesthetic prefers vertical stacking with one optional secondary column (e.g. a circular indicator beside a list of bars).

## Elevation & Depth

**Three elevation tiers, all shadow-based — no borders on primary surfaces.**

- **Tier 1 — soft card lift:** `0 8px 30px rgba(0, 0, 0, 0.03)`. Used for every standard card on the canvas. The shadow is so subtle it reads as a halo more than a lift.
- **Tier 2 — small inset element:** `0 2px 10px rgba(0,0,0,0.04)` paired with a `1px` border in `rgba(0,0,0,0.02)`. Used for circular icon containers inside list rows — small enough that they need both shadow and a hairline to register.
- **Tier 3 — floating navigation:** `0 12px 40px rgba(0, 0, 0, 0.08)`. Used only for the floating bottom tab bar.
- **Brand glow:** `0 4px 14px rgba(255, 90, 95, 0.3)` is exclusive to the primary CTA — it makes coral feel warm and present without inflating the button.

Never combine tiers. Never add inner shadows. Never use shadow on text.

## Shapes

A small, deliberate radius vocabulary:

- `{rounded.lg}` (24px) — primary cards. Generous but not pillowy.
- `{rounded.md}` (20px) — compact stat tiles and pressable list-row hover containers.
- `{rounded.sm}` (8px) — reserved for any rare inline tag or input affordance (not used in this base set, but available).
- `{rounded.full}` — pills, the primary CTA, progress bars, progress-ring caps, the tab bar, all circular icon containers, and active-tab indicator dots.

**Shape rule of thumb:** containers are softly rounded (20–24px); anything interactive that's not a card is fully pill-shaped or circular. There are no sharp corners anywhere in the system except inside SVG strokes (which use `stroke-linecap="round"` to soften them too).

## Components

### card

The default surface — white fill, generous radius, soft shadow, no border.

```html
<div class="bg-white rounded-[24px] p-6 shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
  <div class="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase mb-6">[Section kicker]</div>
  <!-- card content -->
</div>
```

A card almost always opens with a `label-uppercase` eyebrow as its first child, providing voice and orientation before any heavier content.

### card-compact

For stat tiles in a triptych. Tighter padding, smaller radius, same shadow.

```html
<div class="bg-white rounded-[20px] p-5 flex flex-col items-center justify-center shadow-[0_8px_30px_rgba(0,0,0,0.03)]">
  <span class="font-display text-[28px] font-medium tracking-tight mb-1 text-zinc-900">[Value]</span>
  <span class="text-[9px] font-bold tracking-[0.15em] text-zinc-400 uppercase text-center">[Label]</span>
</div>
```

One tile per row may swap the value color to `{colors.primary}` for emphasis — at most one per triptych.

### button-primary

The signature action. Coral fill, full pill, semibold body-lg text, brand glow shadow, subtle press scale.

```html
<button class="w-full bg-[#FF5A5F] hover:bg-[#FA4F54] text-white rounded-full py-4 font-semibold text-[17px] tracking-wide shadow-[0_4px_14px_rgba(255,90,95,0.3)] transition-all active:scale-[0.98]">
  [Action label]
</button>
```

Almost always full-width inside a card. There is no secondary or tertiary button style in this base aesthetic — non-primary actions become text links in `{colors.on-surface-variant}` or icon-only ghost buttons.

### button-icon-ghost

Small, unfilled, top-right card affordance.

```html
<button class="text-zinc-400 hover:text-zinc-900 transition-colors">
  <iconify-icon icon="lucide:[icon-name]" class="size-5"></iconify-icon>
</button>
```

### list-row

Borderless, divider-less rows that rely on a circular icon badge + two lines of text + a trailing chevron. The pressable target extends slightly past the gutter via negative margin so the hover/press tint feels like a full-width sweep.

```html
<div class="group rounded-[20px] p-3 -mx-3 flex items-center gap-4 transition-colors hover:bg-black/[0.02] active:bg-black/[0.04] cursor-pointer">
  <div class="w-12 h-12 rounded-full bg-white shadow-[0_2px_10px_rgba(0,0,0,0.04)] border border-black/[0.02] flex items-center justify-center text-zinc-900 flex-shrink-0">
    <iconify-icon icon="lucide:[icon-name]" stroke-width="2" class="size-5"></iconify-icon>
  </div>
  <div class="flex-1">
    <div class="font-medium text-[15px] text-zinc-900 mb-0.5 group-hover:text-[#FF5A5F] transition-colors">[Primary line]</div>
    <div class="text-[13px] text-zinc-500">[Secondary line]</div>
  </div>
  <iconify-icon icon="lucide:chevron-right" class="size-5 text-zinc-400"></iconify-icon>
</div>
```

The primary line tints to coral on hover — this is the only place coral appears as a transient state.

### badge-circle

Used inside list rows. White fill, hairline border, soft tier-2 shadow, line-style icon at 2px stroke for slightly more presence than chrome icons.

### progress-bar

Inline horizontal progress. 6px tall, fully pill-shaped, sunken track with a colored fill that uses an illustration-palette color (never the brand coral inside cards with multiple bars — that would over-flag a single category).

```html
<div class="h-1.5 w-full bg-zinc-100 rounded-full overflow-hidden">
  <div class="h-full bg-[#708D81] rounded-full" style="width: 70%"></div>
</div>
```

A bar is paired above with two flex-justified caption lines: a `body-sm` muted label on the left, and a value pair on the right where the current value uses `{colors.on-surface}` and the goal/total uses `{colors.on-surface-faint}`.

### progress-ring

110px square SVG, 8px stroke, sunken track ring, coral progress ring with `stroke-linecap="round"`, content centered inside (large numeral + tiny uppercase label).

```html
<div class="relative w-[110px] h-[110px] flex-shrink-0">
  <svg class="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
    <circle cx="50" cy="50" r="42" stroke="#F4F4F5" stroke-width="8" fill="none" />
    <circle cx="50" cy="50" r="42" stroke="#FF5A5F" stroke-width="8" fill="none" stroke-linecap="round"
            stroke-dasharray="263.89" stroke-dashoffset="92" />
  </svg>
  <div class="absolute inset-0 flex flex-col items-center justify-center">
    <span class="font-display text-[26px] font-medium tracking-tight text-zinc-900">[Value]</span>
    <span class="text-[10px] text-zinc-500 font-medium uppercase tracking-wider mt-[-0.5]">[Unit]</span>
  </div>
</div>
```

This is one of the rare places coral is allowed beyond the CTA — because the ring acts as a single, focused emphasis surface.

### tab-bar (floating, bottom)

The only piece of glassmorphism in the system. Translucent white, heavy backdrop blur, fully pill-shaped, tier-3 shadow, hairline white border for crispness on busy backgrounds. Floats 32px above the viewport bottom and is narrower than the content column.

```html
<nav class="fixed bottom-8 left-0 right-0 z-50 flex justify-center pointer-events-none px-6">
  <div class="w-full max-w-[340px] bg-white/85 backdrop-blur-xl px-6 py-4 rounded-full shadow-[0_12px_40px_rgba(0,0,0,0.08)] border border-white/60 flex justify-between items-center pointer-events-auto">
    <button class="flex flex-col items-center gap-1.5 w-12">
      <iconify-icon icon="lucide:[icon-name]" stroke-width="2" class="size-6 text-[#FF5A5F]"></iconify-icon>
      <div class="w-1 h-1 rounded-full bg-[#FF5A5F]"></div>
    </button>
    <button class="flex flex-col items-center gap-1.5 w-12 group">
      <iconify-icon icon="lucide:[icon-name]" stroke-width="1.5" class="size-6 text-zinc-300 group-hover:text-zinc-900 transition-colors"></iconify-icon>
      <div class="w-1 h-1 rounded-full bg-transparent"></div>
    </button>
    <!-- repeat inactive items -->
  </div>
</nav>
```

The active state uses two reinforcing signals: a coral-tinted icon at 2px stroke (vs. 1.5px inactive) plus a 4px coral dot below. There is no pill background, no scale change, no label text.

### Header pattern

Page headers stack a tracked-out uppercase eyebrow over a single-line greeting headline, separated by 8px. No avatar, no right-side controls in the base pattern — controls move into card chrome instead.

```html
<header class="mb-10">
  <div class="text-[10px] font-bold tracking-[0.15em] text-zinc-400 uppercase mb-2">[Eyebrow / context]</div>
  <h1 class="text-[26px] font-medium tracking-tight text-zinc-900">[Greeting or title].</h1>
</header>
```

## Iconography

**Set: Lucide.** This choice is load-bearing — Lucide's open, geometric line forms with consistent 1.5–2px strokes match the type's editorial restraint. Phosphor or Heroicons would feel too round; Solar would feel too bold.

**Variant convention:** line-only throughout. There is no filled variant in chrome.

**Stroke weights:**
- 1.5px (Lucide default) for inline meta icons, inactive tab icons, and ghost buttons.
- 2px for active tab icons and icons inside circular badge containers — slightly heavier so they hold their own against the badge background.
- 2.5px for confirmation/check marks inside list-row badges, where a chunkier line reads as decisive completion.

**Sizes:** 18px for inline meta, 20px for ghost buttons and badge contents, 24px for tab-bar icons.

**Active vs. inactive:** signaled by color (coral vs. faint zinc) and stroke weight (+0.5px), never by switching to a filled glyph.

## Illustration & Imagery

_(no source images — implementer may add per the aesthetic's overall mood. If imagery is introduced, it should be soft, editorial, low-contrast, with a muted earthy palette drawn from `illus-moss`, `illus-amber`, and `illus-clay`. Avoid 3D, claymation, photoreal, or saturated cartoon styles — they would clash with the restrained typographic system.)_

## Hierarchy & Emphasis

- **Loudest thing on screen:** the single primary CTA, in coral with brand glow.
- **Second loudest:** large editorial numerals in `Inter Tight` Medium — they earn weight through size, not color.
- **Section voice:** the tracked uppercase eyebrow always introduces a card or section. It whispers but anchors.
- **Body:** Medium-weight 15px zinc-900, calm and even.
- **Metadata always whispers:** zinc-500 for live values, zinc-400 for goals/totals, zinc-300 for inactive states.

The rule: **at most one coral element per visible section**. If a card already uses a coral progress ring, its primary stat tile should not also be coral. Saturation is currency — spend it once.

## Distinctive Details

1. **The tracked uppercase eyebrow.** Every card and section opens with a tiny (10px) Bold, uppercase, 0.15em-tracked label in muted zinc. It's the most recognizable signature of the aesthetic and replaces the "card title" pattern most apps use.
2. **Two-tone numerals for ratios.** When showing X/Y ratios in a stat tile, the current value uses `{colors.on-surface}` and the divider+goal uses `{colors.on-surface-faint}` (e.g. `3` solid, `/5` faint). This makes the meaningful number pop without any color use.
3. **Borderless rows with a bleed-press target.** List rows use `-mx-3 p-3` so the pressed/hover tint extends past the visual content edge — interaction feels generous and full-bleed even though the row itself looks unbordered and quiet at rest.
4. **The coral glow on the CTA.** A 4px-offset, 14px-blur, 30%-opacity coral shadow under the primary button is the only color-tinted shadow in the system. It makes the action feel warm and slightly lifted without changing the button geometry.

## Do's and Don'ts

### Do
- Use `{colors.surface-alt}` as the canvas and `{colors.surface}` for floating cards — always both, never one.
- Open every card and section with a `label-uppercase` eyebrow.
- Use Inter Tight Medium for any numeral that's meant to feel editorial or large; keep Inter Medium for everything else.
- Reserve coral for the primary CTA, the active tab state, the active progress ring, and at most one numeral per screen.
- Use line icons from Lucide at 1.5px (inactive) or 2px (active) stroke.
- Put soft shadow (`0 8px 30px rgba(0,0,0,0.03)`) on cards instead of borders.
- Use illustration-palette colors (moss, amber, clay) for categorical data fills only.
- Keep generous gutters (24px) and generous card padding (24px); resist the urge to compress.

### Don't
- Don't use coral as a card background, large fill area, or text-color for body content.
- Don't add borders to cards — they break the editorial-paper feel.
- Don't use Bold (700) for headlines or numerals; Bold is reserved for uppercase labels only.
- Don't tighten the 0.15em tracking on uppercase labels — the wide spacing is the entire effect.
- Don't introduce filled-variant icons; the system is line-only.
- Don't put more than one coral emphasis per section.
- Don't let illustration-palette colors leak into chrome (buttons, nav, headings, links).
- Don't add gradients, glassmorphism, or heavy shadows anywhere except the floating tab bar.
- Don't switch active states by changing icon shape (line→fill); use color + stroke weight only.
- Don't use sharp corners — every container is at least `{rounded.md}`, every interactive non-card element is pill or circle.
