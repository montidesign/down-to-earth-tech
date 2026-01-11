# Project Rules & Tech Stack

## Goal
We are rebuilding an existing website (https://downtoearthtech.net) pixel-perfectly using a modern static stack. The output must be production-ready code.

## Tech Stack
1. **Framework:** Astro (Static Build).
2. **Styling:** Tailwind CSS (Mobile-first, utility classes).
3. **Interactivity:** Alpine.js (Use `x-data`, `x-show` for menus/modals. NO React/Vue).
4. **Icons:** Lucide-Astro (or Heroicons SVG if needed).

## Component Strategy
- **Atomic Design:** Break the design into small, reusable `.astro` files (e.g., `Button.astro`, `SectionHeading.astro`).
- **Props:** All text, images, and links must be exposed as Props.
- **Images:** Use the standard `<img>` tag for now, or Astro's `<Image />` if referencing local assets.

## Workflow for Rebuilding Pages
1. I will provide a Screenshot or URL of a section.
2. You will generate the Astro component code.
3. **Crucial:** You must use semantic HTML (`<header>`, `<main>`, `<section>`, `<footer>`).
4. **Crucial:** Ensure the mobile view is perfect (use `md:` and `lg:` prefixes in Tailwind).
5. **Crucial:** WCAG-2.2 compliance is vital. The site must be accessible.s

## Specific Features
- **Forms:** Forms must POST to `/contact.php`. Do not use JavaScript `preventDefault` on submission unless we are adding validation.
- **Navigation:** The mobile menu must be built using Alpine.js for the toggle state.