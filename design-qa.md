# Design QA — Startseiten-Hero

## Vergleichsziel

- Source visual truth: `/Users/eleftheriossamouladas/Desktop/Bildschirmfoto 2026-08-02 um 23.05.39.png`
- Browser-rendered implementation: `/tmp/chelonaki-hero-after-desktop-final.png`
- Mobile implementation: `/tmp/chelonaki-hero-after-mobile-final.png`
- Full-view comparison: `/tmp/chelonaki-hero-comparison-full.png`
- Focused hero comparison: `/tmp/chelonaki-hero-comparison-focus.png`
- State: deutsche Startseite, Tula-Hero sichtbar
- Desktop CSS viewport: 1217 × 1019 px at device scale factor 1
- Source pixels: 1199 × 1019 px
- Implementation pixels: 1202 × 1006 px
- Normalization: implementation full view was scaled to 1199 × 1019 px for the side-by-side comparison. The source hero crop (1128 × 397 px) was compared with the implementation hero crop (1116 × 400 px), normalized to 1128 × 397 px.

## Comparison history

### Iteration 1

- [P1] Tula was visibly stretched horizontally from her natural 2:3 aspect ratio into an approximately 540 × 440 px box.
- [P2] The oversized character obscured most of the house and dominated the text/image balance.
- [P2] On narrow screens, the oversized character collided with the copy and primary button.

Fixes:

- Replaced conflicting width and max-height constraints with proportional auto width and breakpoint-specific height.
- Reduced and repositioned Tula on desktop and mobile.
- Shifted the background crop upward and softened the dark overlay while preserving text contrast.
- Added a cache-version bump so the corrected CSS is loaded after deployment.

Post-fix evidence:

- Desktop Tula renders at approximately 301 × 451 px, matching the source asset’s 2:3 aspect ratio.
- The house, coastline, heading, paragraph, and CTA remain clearly visible.
- At 390 × 844 px, Tula stays below the heading and does not obscure the CTA.

## Required fidelity surfaces

- Fonts and typography: existing display and UI font families, weights, sizes, wrapping, and hierarchy are preserved. No truncation or overlap is visible.
- Spacing and layout rhythm: hero dimensions, radii, padding, and surrounding stat-card rhythm are preserved. Character placement now leaves intentional negative space.
- Colors and visual tokens: navy, gold, white, borders, and shadows remain aligned with the existing theme. The lighter overlay still provides sufficient white-text contrast.
- Image quality and asset fidelity: supplied background and transparent Tula WebP assets remain sharp and are no longer distorted. Crop and focal point are appropriate on desktop and mobile.
- Copy and content: all product copy and language labels are unchanged.

## Interaction and runtime checks

- Primary “Insel entdecken” action opened the island route successfully.
- Browser console errors: none.
- Horizontal overflow: none.
- Full automated suite: passed, with one transient asset-route timeout passing on retry; the isolated mobile Safari rerun passed.

## Findings

No actionable P0, P1, or P2 findings remain. The difference in XP and shell values between source and implementation is expected local state and does not affect the visual correction.

Focused-region comparison was required because the problem concerned character proportions, crop, and overlap within the hero. The focused comparison confirms the asset now retains its intended aspect ratio and visual hierarchy.

final result: passed
