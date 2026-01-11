---
active: true
iteration: 1
max_iterations: 30
completion_promise: "COMPLETE"
started_at: "2026-01-11T15:54:28Z"
---

Finish a 1:1 replication of https://downtoearthtech.net (selected pages only) inside the existing repo. This is NOT a redesign and NOT an approximation. Every pixel-ish decision must come from the original pages.

PAGES IN SCOPE (replicate exactly)
- https://downtoearthtech.net/managed-it-consulting-services-and-support/
- https://downtoearthtech.net/lenovo-servers-and-workstations/
- https://downtoearthtech.net/computer-network-support/
- https://downtoearthtech.net/business-surveillance-systems/
- https://downtoearthtech.net/about-us/
- https://downtoearthtech.net/contact/
NOTE: The Data Hub blog is OUT OF SCOPE (save for another session).

NON-NEGOTIABLE RULES (if you break any, you must undo and redo)
1) NO CUSTOM STYLES EVER.
   - No <style> tags.
   - No inline style=.
   - No custom CSS files.
   - Only Tailwind utility classes and existing project utilities/components (if already present).
2) DO NOT CHANGE CONTENT.
   - Use the exact headings, paragraphs, button labels, phone numbers, addresses, etc.
   - Do not paraphrase or improve text.
3) DO NOT CHANGE LAYOUT.
   - Spacing, alignment, section order, column structure must match the original.
   - If the original has a specific max-width, padding, gap, or breakpoint behavior, replicate it.
4) YOU MUST USE ORIGINAL ASSETS.
   - All images used on these pages must be pulled from the original site.
   - Do not substitute placeholders.
   - Download and store them in the repo (or use the same URLs only if the project architecture already requires remote assets — prefer local copies).
5) YOU MUST VERIFY WITH PLAYWRIGHT.
   - Not looks fine. Real checks:
     - Multiple viewport screenshots.
     - Behavior checks (scroll/sticky header).
     - Spot-check computed styles for key elements (background colors/opacity, positioning, spacing).

KNOWN FAILURES FROM LAST ATTEMPT (you must fix all of these)
A) INTERIOR PAGE HEADER BEHAVIOR:
   - The interior page header is STICKIED at the top in the original and DOES NOT slide down on scroll.
   - Implement: header stays fixed/sticky with correct top offset and does not animate/slide in/out during scroll.
   - Verify with Playwright by scrolling and confirming header remains visible and does not transition in a different way than the original.
B) IMAGES:
   - You failed to pull the images from the original.
   - Fix: Identify every image on each in-scope page (including hero, section images, icons if they’re images).
   - Pull exact images. Use correct dimensions/aspect ratios. Ensure they render the same.
C) LAYOUT FIDELITY:
   - You changed layout / approximated.
   - Fix: replicate section-by-section with correct grid/flex, widths, order, spacing, and breakpoints.
D) BACKGROUNDS + TRANSPARENCIES:
   - You did not match background colors, overlays, gradients, and opacity levels.
   - Fix: replicate exact background colors/opacity using Tailwind utilities (including /xx opacity forms).
   - Use Playwright computed style checks for background-color, background-image, opacity, and overlay layers for critical sections.
E) PLAYWRIGHT DEPTH:
   - You didn’t do deep verification.
   - Fix: Use a structured verification checklist per page (see below) and output results.

WORKFLOW (Ralph’s Very Serious Checklist)
For EACH PAGE, do all steps in order:

STEP 1 — SOURCE OF TRUTH CAPTURE (Playwright)
- Use Playwright to open the live page.
- Capture screenshots at these viewports: 375x812, 768x1024, 1280x720, 1536x900.
- Also capture one fullPage screenshot at desktop width (at least 1280).
- Save these screenshots into /docs/verification/original/<page-slug>/...
- In your notes, list all major sections in order and identify their structure (hero, two-column section, cards, CTA, footer, etc.).
- Record key CSS facts for:
  - header (positioning, top, z-index, height)
  - hero background (color/gradient/image/overlay + opacity)
  - any section with a tinted overlay background

STEP 2 — ASSET HARVEST
- Identify and download all images used on the page.
- Store them under /public/media/
- Confirm you did not miss any images.
- Use the original filenames if possible; if not, keep a mapping file.
- Create assets-map.md entries:
  - page slug
  - original URL
  - local path
  - where used (component/file)

STEP 3 — IMPLEMENTATION (Tailwind-only)
- Implement or correct the page using reusable components where it truly matches multiple pages.
- NO layout guessing: match your sections list from Step 1.
- Make sure header behavior matches (sticky, no slide-down animation).
- Ensure all backgrounds/transparencies match using Tailwind classes.
- Ensure typography scale matches the original (sizes, weights, line-height) using Tailwind utilities only.

STEP 4 — LOCAL VERIFICATION (Playwright)
- Use Playwright to open the LOCAL page.
- Capture same screenshots and save to /docs/verification/local/<page-slug>/...
- Run comparisons:
  - Visual: place original vs local screenshots side-by-side (even manual is ok).
  - Behavior: scroll test verifying sticky header behavior.
  - Computed style spot checks (must do at least these):
    - header position (sticky/fixed), top, z-index
    - at least 2 background sections: background-color and opacity/overlay
    - at least 1 button: background-color + hover behavior (if present on original)
- Write results to /docs/verification/report.md with:
  - ✅ Matches / ❌ Mismatch
  - What changed to fix it
  - Remaining diffs (if any)

STEP 5 — LINT + BUILD CHECK
- No linter errors.
- No broken imports.
- No unused components.
- Confirm pages route correctly.

STEP 6 — GIT COMMIT
- After each page is verified, commit with message:
  - Replicate <page-slug> (1:1)
- Include verification artifacts in repo under /docs/verification/...

GLOBAL REQUIREMENTS
- Keep a running log at /docs/replication-log.md:
  - timestamp
  - what you changed
  - why (tie it to a mismatch you observed)
  - which page
- Reuse components ONLY when it doesn’t create differences.
- Footer/header must match site-wide, but interior header behavior must match original exactly.
- If approaching iteration limits or token limits:
  - Update /docs/status.md with:
    - completed pages
    - outstanding mismatches
    - next exact steps to finish
    - what to verify next in Playwright
  - This status doc must allow a new session to pick up instantly.

DEFINITION OF DONE (no excuses)
- All 6 pages match original layout/content/visuals at the 4 viewports.
- Sticky interior header works like original (no slide-down animation; remains stickied).
- All images are the exact originals.
- Backgrounds and transparencies match.
- Playwright verification artifacts exist for each page (original + local screenshots).
- No linter errors.
- Documentation updated.
- GitHub commits made after each page is complete.

Output (open bracket)promise(closed bracket)COMPLETE(open bracket)/promise(closed bracket) when done.
